# Arquitetura — CRM Restaurant (SaaS multi-tenant)

> Documento vivo. Registra as decisões arquiteturais tomadas antes da
> refatoração começar. **Nenhum código é alterado a partir destas decisões
> até este documento estar fechado e aprovado.** Toda nova conversa sobre
> arquitetura é registrada aqui, não em outro lugar.
>
> Branch de trabalho: `refactor/architecture`.
> Origem: auditoria completa de `apps/admin` (14/09/2026), publicada no
> Notion ("Auditoria de Arquitetura — apps/admin"), que motivou repensar a
> arquitetura antes de continuar evoluindo o produto.

## 1. Contexto e decisão de produto

O projeto nasceu como um admin interno para um único restaurante ("Nosso
Quintal"). Decisão tomada: o produto vira um **SaaS multi-tenant** — outros
restaurantes vão poder assinar e usar a mesma plataforma, isolados entre si.
Isso muda decisões estruturais que antes eram implícitas (havia só "o"
restaurante) e agora precisam de modelo de dado e autorização explícitos.

## 2. Modelo de entidades

### 2.1 Hierarquia

```
Plataforma (você, super-admin)
  └─ Restaurante (tenant — quem assina o SaaS)
       ├─ Usuários/staff do restaurante (papéis: admin, caixa, financeiro,
       │  cozinha, estoquista, entregador, rh, ...)
       ├─ Empresa (cliente B2B do restaurante — pede marmita pros
       │  funcionários dela; conceito que já existia, agora pertence a um
       │  restaurante específico)
       │    └─ Colaborador / pedido do dia
       ├─ Catálogo, Estoque, Financeiro, Compras, RH, Configurações
       └─ restaurante_config (nome fantasia, CNPJ, endereço, preços de
          café/suco/lanche — hoje fixo em `.env`, vira dado de tenant)
```

- **`empresa` não é o tenant.** Ela é e continua sendo o cliente B2B do
  restaurante (quem pede marmita), só passa a ter `restaurante_id`.
- **`restaurante` é o tenant.** É quem assina o SaaS, tem staff próprio,
  estoque próprio, financeiro próprio.
- Nosso Quintal migra os dados existentes para ser o **tenant #1** real da
  plataforma — não fica como instalação separada.

### 2.2 Isolamento de dado

- Estratégia: **`restaurante_id` (coluna) + filtro obrigatório na
  aplicação**, não Row-Level Security nem schema separado por tenant. Mais
  rápido de implementar agora; RLS fica como evolução futura se o modelo de
  ameaça exigir defesa em profundidade no próprio banco.
- Toda tabela per-restaurante (estoque, catálogo, financeiro, RH,
  configurações, `empresa`) tem `restaurante_id` direto ou herda via FK já
  existente (`empresa_id` → `empresa.restaurante_id`).
- **Regra de segurança inegociável**: o `restaurante_id` usado numa query ou
  Server Action **nunca vem do payload do client** — sempre é derivado no
  servidor a partir de `session.activeOrganizationId`. Isso fecha o achado
  crítico da auditoria de segurança (RBAC só reforçado em `proxy.ts`, não
  dentro das Server Actions).

## 3. Autenticação e autorização

### 3.1 Better-auth: plugin `organization`

Decisão: adotar o plugin `organization` do better-auth em vez de construir
RBAC/multi-tenant do zero. Ele já entrega:

- `organization` — vira o **restaurante** (identidade: `id`, `name`, `slug`,
  `logo`, `metadata`). Dados de negócio (CNPJ, endereço, preços) ficam numa
  tabela satélite `restaurante_config` (1:1 por `organizationId`), porque não
  cabem no schema nativo do plugin.
- `member` (`userId`, `organizationId`, `role`) — vínculo usuário↔restaurante
  com papel. Um usuário pode pertencer a **múltiplos restaurantes** (decisão
  confirmada — necessário pra convites e pra você dar suporte a clientes sem
  precisar de conta separada por tenant).
- `invitation` — usado tanto no signup self-serve (cria org + primeiro membro
  como owner) quanto pra convidar staff depois.
- `session.activeOrganizationId` — o tenant "ativo" da sessão corrente; é a
  única fonte de verdade pro `restaurante_id` usado em queries/actions.

### 3.2 Papéis (roles)

- Conjunto **fixo** pra todos os restaurantes (mesmo enum de hoje: `admin`,
  `caixa`, `financeiro`, `cozinha`, `estoquista`, `entregador`, `rh`, ...).
  Sem permissão customizável por tenant — decisão consciente de não pagar
  essa complexidade agora.
  - Não usamos a tabela opcional `organizationRole` do plugin (é pra
    permissão customizável por org, fora do escopo).
- `member.role` é avaliado **dentro do contexto do `activeOrganizationId`**,
  substituindo o campo de role global que existe hoje no usuário.
- **Super-admin da plataforma** (você) é um conceito separado de qualquer
  organização — reaproveita o `user.role` global do plugin `admin()` do
  better-auth com um valor próprio (ex.: `platform_admin`), sem vínculo com
  restaurante nenhum. Não é um `member.role` de nenhuma org.

### 3.3 RBAC dentro das Server Actions (correção do achado crítico da auditoria)

Hoje `proxy.ts` faz gating de rota por papel, mas as Server Actions só
checam sessão (`authActionClient`), não papel — qualquer cargo pode disparar
qualquer action. Decisão: criar clients de domínio em `safe-action.ts` (ex.:
`financeiroActionClient`, `rhActionClient`, `estoqueActionClient`) que
verificam `member.role` do `activeOrganizationId` contra a lista de papéis
permitida daquele domínio, reaproveitando a mesma tabela de papéis que hoje
só existe em `ROUTE_ROLES` de `proxy.ts` — rota e action passam a usar uma
única fonte de verdade.

### 3.4 Roteamento / seleção de tenant

- Domínio único (não subdomínio por tenant). Login único; se o usuário
  pertence a mais de um restaurante, escolhe qual usar (define
  `activeOrganizationId`); se pertence a só um, entra direto nele.

### 3.5 Onboarding

- Signup **self-serve** desde o início: criar conta já cria um novo
  restaurante e libera o acesso na hora (sem aprovação manual). Quem assina
  se torna owner (`member.role = admin`) do restaurante recém-criado.

### 3.6 Cobrança

- **Fora do escopo desta fase.** Não integra gateway de pagamento agora. Só
  deixamos `restaurante_config` preparado com um campo de status (ex.:
  `trial` / `ativo` / `suspenso`) pra não fechar a porta depois.

## 4. Fluxo padrão de uma feature (sem camada `Service` separada)

```
Client/Server Component
  → Server Action (schema Zod → client de autorização por domínio → orquestração)
    → helper de negócio testável (lib/*-helpers.ts)
      → queries.ts (leitura) / executarLote (escrita)
        → Drizzle
          → PostgreSQL
```

- Não introduzimos uma camada `Service` genérica — a Server Action já
  orquestra; regra de negócio pura vive em helpers testáveis (padrão que já
  existe em parte do código, ex. `estoque-helpers.ts`, `folha-helpers.ts`) e
  passa a ser **obrigatório**, não opcional.
- Toda Server Action segue o contrato: `.schema(zod)` → client de
  autorização de domínio → helper → `executarLote` se houver múltiplos
  writes → `revalidateTag`/`updateTag`. Erro sempre mascarado via
  `ActionError`/`handleServerError` — nunca repassar `err.message` cru
  (achado da auditoria de backend).

## 5. Estrutura de feature

- Mantém o padrão já documentado e seguido pelas 9 features:
  `components/{list,form,detail,shared}` + `lib/{queries.ts, actions.ts,
  schemas.ts, types.ts, *-helpers.ts}`.
- Todo `actions.ts`/`queries.ts` acima de ~300 linhas deve ser dividido por
  subdomínio (corrige `features/empresas/lib/actions.ts` com 906 linhas e
  `queries.ts` com 792 linhas, achado ALTO da auditoria de estrutura).
- `queries.ts` é a única porta de leitura Drizzle da feature — não é
  importado por componente de outra feature diretamente, só via um
  `index.ts` público (corrige os 50+ cross-imports diretos achados na
  auditoria).

## 6. Regras de domínio

### 6.1 Estoque

- Livro-razão append-only (`estoque_movimento`) + saldo agregado
  (`estoque_item.quantidade_atual`) — padrão já usado, mantém.
- **Corrigido em 23/09/2026** (`aplicar-movimento.ts`): o `UPDATE` do saldo
  é atômico em SQL (`quantidade_atual = quantidade_atual + $delta`), nunca
  mais ler-calcular-escrever em JS. `saldo_resultante` do livro-razão também
  passou a ser lido de volta do banco (subquery pós-update), não calculado em
  JS. Foi tratado como exceção urgente à regra "sem código antes do
  documento fechado" (topo deste arquivo) porque a feature `mesas`
  (implementada em código antes deste documento ser atualizado — ver nota de
  processo em §10) passou a exercitar esse caminho com concorrência real
  (garçons lançando pedido ao mesmo tempo), tornando o risco teórico em
  risco de produção.

### 6.2 Financeiro

- Mesmo padrão de livro-razão. Toda operação que grava mais de uma tabela
  (fechamento do dia, folha de pagamento, recebimento de compra) é
  **obrigatoriamente** um único `executarLote` — nunca inserts sequenciais
  soltos fora de lote (corrige `finalizarDiaAction`, `abrirInventarioAction`,
  ficha técnica do catálogo, achados MÉDIO da auditoria de banco). IDs
  intermediários são pré-gerados no client com `createId()` em vez de
  depender de `.returning()` sequencial entre statements.

### 6.3 Integrações

- Segredos (chave de assinatura QZ Tray, credenciais better-auth) só em
  Server Action ou rota de API, nunca em Client Component — já é seguido.
- Toda rota de API (`/api/qz/*`, etc.) precisa estar mapeada em
  `ROUTE_ROLES`/equivalente de autorização — hoje `/api/qz/sign` não está
  (achado ALTO da auditoria de segurança).

### 6.4 Clientes pessoa física (pacotes individuais pré-pagos)

Caso real: cliente compra um pacote de N dias pra um grupo de pessoas (ex.:
4 pessoas, cada uma com tamanho de marmita e observações fixas), pago à
vista, com prato definido por pessoa em cada dia — não é uma empresa B2B
(sem CNPJ/contrato) nem atendimento avulso de salão (`mesas`).

- **Decisão: reaproveitar `empresa`/`colaborador_pedido`/
  `pedido_dia_importado`, não criar domínio novo.** O formato já é idêntico
  ao que existe pra empresas — nome da pessoa, data, prato (texto livre),
  tamanho, observação — só que lançado manualmente (drawer "Adicionar
  pedido manual" já existente) em vez de importado por planilha.
- `empresa` ganha um campo `tipo` (`pessoa_juridica` | `pessoa_fisica`).
  CNPJ/contrato ficam opcionais para `pessoa_fisica`.
- Modelo simplificado deliberadamente: **não** há uma sequência de pratos
  com repetição automática nem um "perfil padrão de substituição" por
  pessoa — cada linha (`colaborador_pedido` + `pedido_dia_importado`) é
  lançada explicitamente por dia, prato e observação, exatamente como já
  funciona pra empresa hoje. Se o mesmo prato vale pra todo mundo num dia
  (caso comum), isso é só lançar a mesma coisa 4 vezes, não uma regra
  especial no modelo.
- Pagamento: à vista, uma entrada única no financeiro na venda do pacote —
  sem cobrança recorrente/parcelada por ora.
- Entrega: campo `forma_entrega` (retirada | entrega) — sem logística de
  entrega mais elaborada (endereço/rota) desenhada ainda; entra quando
  aparecer um caso real que precise disso.

## 7. Migração dos dados existentes

- Nosso Quintal passa a ser uma linha real em `organization` (tenant #1).
- Todo dado hoje "implícito" de restaurante único — variáveis de ambiente
  (`nome`, `endereço`, `CNPJ`, `IE`, preços de café/suco/lanche) e tabelas
  sem `restaurante_id` — migra para dentro dessa organização.
- Ordem e script de migração ainda não definidos — entra no plano de
  implementação, depois deste documento fechado.

## 8. Rastreamento da auditoria (referência)

Achados completos por área estão publicados no Notion ("Auditoria de
Arquitetura — apps/admin"). Este documento incorpora as correções
arquiteturais decorrentes; a lista completa de achados item a item
(estrutura, backend, frontend, banco, segurança, performance) permanece lá
como registro do estado do código em 14/09/2026, antes da refatoração.

## 9. Em aberto (ainda não decidido)

- Ordem de execução da refatoração (o que vem primeiro: modelo de tenant,
  RBAC nas actions, ou correções pontuais da auditoria que não dependem de
  multi-tenant).
- Script/estratégia de migração de dado do Nosso Quintal para o modelo novo.
- Se/quando reavaliar RLS como defesa em profundidade adicional ao filtro de
  aplicação.
- Cobrança/planos (explicitamente adiado, ver §3.6).
- Revisão de nomenclatura pendente neste documento: §2/§3 ainda usam
  `restaurante_id`/`restaurante_config` como nome técnico — o código real
  (commits `56b2a6c`/`3f68036`, ver nota de processo em §10) já implementou
  como `organization_id`, sem tabela `restaurante_config` própria. Este
  documento precisa de uma passada pra alinhar o texto ao que já existe.
- RBAC por domínio (§3.3) só foi implementado de fato para `mesas`/
  `catálogo`/`estoque` (como `tenantActionClient`/`garcomActionClient`/
  `caixaActionClient`/`adminTenantActionClient`, por função operacional, não
  por domínio de negócio como o texto original previa). `financeiro`, `rh`,
  `compras` e `empresas` continuam só com `authActionClient` — achado
  crítico da auditoria de segurança ainda aberto nesses domínios.
- `organization_id` ficou nullable (não `NOT NULL`) nas tabelas
  retrofitadas (`categoria_produto`, `produto`, `grupo_adicional`,
  `estoque_item`, `inventario_fisico`), esperando um backfill
  (`setup-diniz-gourmet.ts`) que não existe no repositório — janela real de
  linha sem tenant até isso ser resolvido.
- Substituição pontual num dia específico do pacote de pessoa física (§6.4)
  — como já não há "perfil padrão" fixo, isso já é resolvido por natureza
  (cada linha é independente), mas vale confirmar se a UI de lançamento
  precisa de algum atalho pra "repetir os últimos N dias" quando o pedido
  realmente não muda.

## 10. Log de decisões

| Data | Decisão | Contexto |
|------|---------|----------|
| 2026-09-14 | Produto vira SaaS multi-tenant, não fica single-tenant | Possibilidade de monetizar com múltiplos restaurantes |
| 2026-09-14 | `restaurante` é o tenant; `empresa` continua sendo cliente B2B do restaurante | Evita confundir os dois conceitos |
| 2026-09-14 | Isolamento via `restaurante_id` + filtro em app, sem RLS por ora | Mais rápido de implementar; RLS avaliado como evolução futura |
| 2026-09-14 | Nosso Quintal migra para ser tenant #1 real (não fica separado) | Evita manter duas versões do sistema |
| 2026-09-14 | Papéis por tenant (via `member.role`) + super-admin de plataforma separado | Precisava de um jeito de você administrar todos os tenants |
| 2026-09-14 | Login único, domínio único, seleção de tenant após login | Mais simples de implementar agora que subdomínio por tenant |
| 2026-09-14 | Signup self-serve, libera na hora (sem aprovação manual) | Decisão consciente, aceitando o risco de contas de teste/spam na fase inicial |
| 2026-09-14 | Cobrança fora do escopo desta fase | Foco em fechar a arquitetura antes de adicionar billing |
| 2026-09-14 | Adotar plugin `organization` do better-auth em vez de RBAC/multi-tenant próprio | Evita reimplementar convite, multi-membership e troca de dono |
| 2026-09-14 | Usuário pode pertencer a múltiplos restaurantes | Necessário pra convites e suporte multi-tenant sem conta duplicada |
| 2026-09-14 | Conjunto de papéis fixo para todos os tenants, sem customização por restaurante | Evita a complexidade de um sistema de permissões granular agora |
| 2026-09-18/23 | **Nota de processo**: commits `56b2a6c` (multi-tenant) e `3f68036` (feature `mesas`) foram implementados e enviados direto pro `main` sem atualizar este documento antes | Divergência do fluxo combinado ("fechar arquitetura antes de codar") — revisão de código feita em 23/09 encontrou o que bate e o que diverge do que estava decidido aqui (ver §9) |
| 2026-09-23 | Corrigida a race condition de saldo de estoque (§6.1) como exceção urgente à regra de não codar antes do documento fechado | A feature `mesas` passou a exercitar esse caminho com concorrência real de produção, tornando o risco teórico em risco imediato |
| 2026-09-23 | Pacote pré-pago pra cliente pessoa física reaproveita `empresa`/`colaborador_pedido`/`pedido_dia_importado` (campo `tipo` em `empresa`), sem domínio novo | Formato de dado é idêntico ao que já existe pra empresa; menos código, reusa fluxo de lançamento manual já pronto |
| 2026-09-23 | Modelo do pacote individual não tem sequência de pratos com repetição automática nem perfil padrão de substituição por pessoa — cada dia é lançado explicitamente | Pedido do usuário por simplicidade — "só nome da pessoa + prato que quer no dia", sem abstração de repetição/perfil |
