# Handoff — continuar em outro computador

Gerado em 2026-09-17 pela sessão do Claude Code. Este arquivo é só contexto de
continuidade — pode apagar depois de ler. Ele substitui o `HANDOFF.md`
anterior (14/09), cujos 4 itens pendentes **já foram todos implementados**
(confirmado nesta sessão, ver seção 1).

**Branch atual: `refactor/architecture`** (criada nesta sessão a partir de
`main`, working tree limpo antes de criar). Nada foi commitado ainda — só
`ARCHITECTURE.md` existe como arquivo novo não rastreado (`git status` mostra
`?? ARCHITECTURE.md`). **Nenhum código de `apps/admin` foi alterado** —
combinamos explicitamente que não executamos nem mudamos código até a
arquitetura estar 100% fechada.

## 1. Confirmação: os 4 pendentes do handoff de 14/09 já estavam implementados

Antes de começar qualquer coisa nova, verificamos por agente de pesquisa se
os 4 itens pendentes do handoff anterior (tabs `w-full`, data nos papéis de
impressão, seleção múltipla de pedidos, botão "imprimir novos/atualizados")
já tinham sido feitos — e sim, todos os 4 estavam implementados (por outra
sessão, entre 14/09 e agora):

1. `empresa-tabs.tsx:41-52` — `TabsList` com `flex w-full`, cada trigger
   `flex-1`.
2. `formatDiaSemanaBR` em `lib/formatters.ts:143`, usado nos 4 PDFs
   (resumo do dia, conferência, pesagem, comanda) — todos mostram
   `dd/mm/aaaa` + dia da semana por extenso.
3. `pedidos-tab.tsx` tem checkbox por linha, "selecionar todos" respeitando
   filtro, botão "Excluir selecionados" com confirmação em `AlertDialog`, e
   `removerPedidosAction` (plural) separado do singular.
4. `statusImpressao` extraída pra `lib/pedidos-helpers.ts`; botão
   "Imprimir novos/atualizados (N)" em `pedidos-tab.tsx:653-661`.

Nada a fazer aqui — só constatação.

## 2. Auditoria completa de arquitetura do `apps/admin`

Pedido do usuário: antes de continuar evoluindo o produto, auditar toda a
arquitetura (estrutura, backend, frontend, banco, segurança, performance) do
`apps/admin`, dividida em tasks, com relatório de cada área.

- Criada a branch `refactor/architecture` (working tree já estava limpo).
- 6 agentes rodaram em paralelo, cada um só leitura (Read/Grep/Bash
  read-only), um por área. Cada relatório foi publicado como página no
  Notion, dentro da página "Software" que o usuário indicou
  (`https://app.notion.com/p/3dbe71495ebe8034bf84f2c734e3b986`):
  - Índice: `https://app.notion.com/p/3dbe71495ebe815784c5f9f0e98a2d87`
  - Estrutura: `https://app.notion.com/p/3dbe71495ebe81959338f3e7bd9f66e1`
  - Backend: `https://app.notion.com/p/3dbe71495ebe81cf96eaea870a070257`
  - Frontend: `https://app.notion.com/p/3dbe71495ebe81daac80d2060a909a16`
  - Banco: `https://app.notion.com/p/3dbe71495ebe8129853de57e57cfd9c2`
  - Segurança: `https://app.notion.com/p/3dbe71495ebe81f081d8d63ffb0a9fd8`
  - Performance: `https://app.notion.com/p/3dbe71495ebe8199958df75cccac149c`

### Achados mais importantes (nenhum CRÍTICO de perda de dado ou vazamento
entre empresas em nenhuma área — os achados abaixo são os de maior impacto)

- **Segurança (achado mais grave do conjunto, CRÍTICO)**: RBAC por papel só
  é reforçado em `proxy.ts` (nível de rota/navegação). Dentro das Server
  Actions, quase tudo usa `authActionClient` (só exige sessão, não checa
  `role`) — qualquer usuário autenticado de qualquer cargo pode em tese
  disparar diretamente actions de financeiro/RH/compras/estoque, já que
  Server Actions são endpoints públicos por ID, não amarrados à rota de
  origem. Também: `createPausaAction`/`deletePausaAction` sem nenhuma
  checagem (stub hoje); `/api/qz/sign` assina qualquer texto com a chave
  privada sem validar payload nem restringir por papel.
- **Banco (ALTO)**: race condition real no saldo de estoque —
  `aplicar-movimento.ts` lê o saldo, calcula em JS, e faz `UPDATE` fixo, sem
  lock nem `SET quantidade_atual = quantidade_atual + $delta` atômico. Duas
  movimentações concorrentes podem se sobrepor. Também: `finalizarDiaAction`,
  `criarProdutoAction` (ficha técnica) e `abrirInventarioAction` fazem
  inserts encadeados fora de `executarLote` — falha no meio deixa dado
  parcial.
- **Performance (CRÍTICO)**: `auth.api.getSession()` chamado em dobro em
  quase toda navegação (layout + página filha, sem `React.cache`); N+1 real
  em `getEmpresas()` (2 `count()` por empresa). Cache (`unstable_cache`) só
  existe em 3 de 9 features; nenhuma listagem grande pagina no banco
  (`LIMIT`/`OFFSET`), só em memória/client.
- **Estrutura (ALTO)**: `features/empresas/lib/actions.ts` com 906 linhas e
  30+ actions de domínios distintos; `pedidos-tab.tsx` com 891 linhas
  misturando UI+regra de negócio+impressão; nenhuma barreira pública entre
  features (50+ cross-imports diretos, sem `index.ts`).
- **Backend (ALTO)**: `features/usuarios/lib/actions.ts` repassa
  `err.message` cru do better-auth pro toast, driblando o mascaramento
  central de erro — único lugar do app com esse padrão. 100% das Server
  Actions validam com Zod (ponto forte).
- **Frontend (ALTO)**: 52% dos arquivos são Client Components; padrão
  repetido de fetch-on-mount (`useEffect`+`useAction`) em vez de Server
  Component + DAL em 7 componentes; `historico-tab.tsx` tem busca/data/página
  em `useState` (perde no refresh — mesmo bug já corrigido em `pedidos-tab`
  pro campo `dia`, mas não generalizado pros outros filtros).

## 3. Pivot de produto: vira SaaS multi-tenant

No meio da conversa sobre a auditoria, o usuário decidiu que o projeto não
fica mais restrito ao Nosso Quintal — vira um **SaaS multi-tenant** pra
outros restaurantes assinarem. Isso motivou uma rodada extensa de perguntas
de arquitetura (via `AskUserQuestion`) pra fechar decisões antes de
implementar qualquer coisa. Todas as decisões estão registradas com data e
contexto na seção 10 (log de decisões) de `ARCHITECTURE.md` — resumo aqui:

- **Hierarquia**: nova entidade **`restaurante`** (tenant) acima de
  `empresa` — `empresa` continua sendo o cliente B2B do restaurante (quem
  pede marmita), não é o tenant.
- **Isolamento**: `organization_id` (não `restaurante_id` — ver nota
  importante abaixo) + filtro obrigatório na aplicação, sem RLS nem schema
  separado por tenant, por ora.
- **Nosso Quintal migra pra ser o tenant #1 real**, não fica como instalação
  separada.
- **Auth**: adotar o plugin `organization` do better-auth (confirmado via
  Context7 — tabelas `organization`/`member`/`invitation` +
  `session.activeOrganizationId`) em vez de RBAC/multi-tenant próprio do
  zero.
- **Papéis**: conjunto fixo (mesmo enum de hoje: admin/caixa/financeiro/
  cozinha/estoquista/entregador/rh), avaliado dentro do
  `activeOrganizationId`. Super-admin da plataforma é separado — reaproveita
  `user.role` global do plugin `admin()` do better-auth com valor próprio
  (`platform_admin`), sem vínculo com nenhum restaurante.
- **Multi-membership**: um usuário pode pertencer a múltiplos restaurantes
  (necessário pra convites e pra você dar suporte multi-tenant).
- **Roteamento**: domínio único, seleção de tenant após login (não
  subdomínio por tenant).
- **Onboarding**: signup self-serve, libera na hora (sem aprovação manual —
  decisão consciente do usuário, aceitando risco de conta de teste/spam na
  fase inicial).
- **Cobrança**: fora do escopo desta fase — só deixar campo de status
  (trial/ativo/suspenso) preparado no schema.

### Refinamentos discutidos depois (⚠️ ainda NÃO escritos em `ARCHITECTURE.md`
— ver pendências na seção 5)

- **Café/suco/lanche e tipo de entrega não são universais.** Tipo de entrega
  (marmita individual vs. pesagem em massa) **já é configurável por
  `empresa`** hoje — não precisa de mudança de modelo, só ganha
  `organization_id` de graça via `empresa`. Café/suco/lanche é diferente:
  hoje é preço fixo por restaurante no fechamento do dia — decisão: virar um
  conceito de **módulos opcionais habilitados por restaurante** (ex.:
  `restaurante.modulos_habilitados` ou tabela `restaurante_modulo`), com a
  config de preço numa tabela satélite que só existe/é usada se o módulo
  estiver habilitado. Assim uma marmitaria que não oferece isso não precisa
  desse dado, e dá pra adicionar outros módulos no futuro sem redesenhar o
  schema.
- **Nome de coluna: `organization_id`, não `restaurante_id`.** Sugestão do
  próprio usuário, aceita — já que a tabela nativa do better-auth se chama
  `organization`, manter esse nome como coluna/FK em todo o schema (não
  `restaurante_id`) fica consistente com a camada de auth e mais abrangente
  pro futuro. "Restaurante" continua sendo o nome do conceito de produto/UI
  em português; `organization_id` é o nome técnico da coluna.
  **`ARCHITECTURE.md` ainda usa `restaurante_id`/`restaurante_config` em
  vários pontos — precisa de uma revisão pra trocar pela nomenclatura
  `organization_id` antes de considerar o documento fechado.**
- **Cargos e permissões detalhados (quem pode ver/fazer o quê) ficam pra um
  documento separado depois** — não vamos redesenhar o RBAC granular agora,
  só garantir que a arquitetura (clients por domínio) permite isso depois.
- **Reestruturação de apps do monorepo** (decidido, não implementado):
  - `apps/web` = porta de entrada pública (marketing a construir + signup
    self-serve + o formulário público `/cardapio/[slug]` que já existe hoje).
    Hoje `apps/web` só tem um placeholder "Hello World!" na home.
  - `apps/admin` é renomeado para **`apps/app`** — passa a ser só o produto
    autenticado multi-tenant (onde o usuário cai depois do login/signup).
  - Painel de super-admin (você + equipe: métricas, financeiro do SaaS,
    impersonate multi-tenant) fica **dentro do mesmo app renomeado**, como
    seção protegida por role (`user.role === 'platform_admin'`), não um app
    separado — menos duplicação de auth/DB/UI pra um time pequeno; pode
    virar app próprio depois se precisar de isolamento maior.
  - **Nada disso foi executado ainda** — é decisão registrada, falta
    escrever em `ARCHITECTURE.md` e depois fazer o rename de fato.

## 4. `ARCHITECTURE.md` (raiz do repo, não commitado)

Documento vivo criado nesta sessão pra registrar toda decisão arquitetural
antes de qualquer refatoração de código. Estrutura: contexto do pivot SaaS,
modelo de entidades, auth/RBAC (plugin `organization`), fluxo padrão de
feature (sem camada `Service` separada — Server Action já orquestra, regra
de negócio em helpers testáveis), regras de domínio (estoque/financeiro),
migração dos dados existentes, itens em aberto, e um log de decisões com
data/contexto. **Precisa da revisão de nomenclatura `organization_id`
mencionada acima antes de considerar fechado.**

## 5. Skill global `nextjs-server-actions` (fora do repositório — não
sincroniza via git!)

O usuário pediu uma skill **global** (usada em qualquer repositório seu, não
só neste projeto) documentando a melhor arquitetura de Server Actions
possível — pesquisada via Tavily (4 pesquisas `tavily_research` completas:
next-safe-action v8, convenção de nome de arquivo por CRUD, DAL/autorização,
organização de schema Zod) antes de escrever qualquer coisa, conforme
instrução explícita do usuário ("se o Tavily não estiver funcionando,
aguarde eu conectar, não faça pesquisa sem ele").

Arquivo reescrito: `~/.claude/skills/nextjs-server-actions/SKILL.md` (+
`templates/safe-action.ts`). Cobre:

- Regra de decisão de arquivo (agrupado até ~5 actions/300 linhas → depois
  disso, um arquivo por ação em `lib/actions/create-employee.ts` etc.,
  verbo-primeiro kebab-case).
- Clients em camadas do next-safe-action (`actionClient` →
  `authActionClient` → `tenantActionClient` — deriva `organizationId` da
  sessão, nunca do payload → clients por domínio de negócio).
- Autorização como defesa em profundidade: `proxy.ts`/middleware não é o
  controle de segurança real; a DAL de leitura também precisa checar que o
  recurso pertence ao tenant, não só as actions de escrita.
- DAL sempre devolve DTO (Zod-parseado), nunca a entidade crua do ORM;
  `React.cache()` pra evitar chamada duplicada de sessão por request.
  Composição de schema Zod (base + `.partial()/.extend()`) em vez de
  duplicar.

**⚠️ Isso está em `~/.claude/skills/`, fora do repositório `CRM-Restaurant`
— não vai no `git push`.** No outro computador, essa skill não vai existir
até você (a) copiar esse arquivo manualmente pra lá, ou (b) pedir pra essa
sessão do Claude Code lá refazer a mesma pesquisa/skill do zero.

## 6. Pendências / próximos passos claros

1. **Atualizar `ARCHITECTURE.md`** com os refinamentos da seção 3 acima
   (trocar `restaurante_id`→`organization_id`, adicionar o conceito de
   módulos opcionais por restaurante, e a decisão de topologia de apps
   `apps/admin`→`apps/app` + painel super-admin como seção protegida).
2. **Decidir a ordem de execução da refatoração** — ainda não decidido: o
   que vem primeiro (modelo de tenant, RBAC nas actions, ou correções
   pontuais da auditoria que não dependem de multi-tenant).
3. **Definir o script/estratégia de migração de dado do Nosso Quintal** pro
   modelo multi-tenant novo.
4. **Criar depois** (explicitamente adiado, não esquecer): documento de
   cargos/permissões detalhado (quem pode ver/fazer o quê por cargo).
5. **Reavaliar RLS** como defesa em profundidade adicional — não agora, mas
   está registrado como item em aberto no `ARCHITECTURE.md`.
6. Cobrança/planos do SaaS — fora do escopo desta fase (billing gateway,
   etc.), só deixar campo de status preparado.
7. **Nenhum código foi alterado ainda** — nem o rename de `apps/admin` pra
   `apps/app`, nem nenhuma correção da auditoria. Tudo aguarda o
   `ARCHITECTURE.md` estar fechado, por pedido explícito do usuário.

## 7. Outras coisas pra saber

- `check-types`, lint e os testes **não foram executados nesta sessão** (não
  houve mudança de código em `apps/admin` que justificasse rodar).
- A branch `refactor/architecture` está só com `ARCHITECTURE.md` como
  arquivo novo, não commitado. Sem commits novos nesta sessão.
- Os relatórios completos da auditoria (achados item a item, com
  arquivo:linha) ficam só no Notion (links na seção 2) — este handoff resume,
  não substitui.
