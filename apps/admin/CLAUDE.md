# apps/admin

Painel administrativo (Next.js 16, App Router, React 19, React Compiler
habilitado). Regras gerais em `../../CLAUDE.md` (`@docs/rules/*.md`) — este
arquivo só cobre o que é específico deste app.

## Estrutura

```
app/                     ← só rotas (page.tsx, layout.tsx, proxy.ts, api/)
features/<nome>/         ← toda lógica de cada feature (ver docs/rules/architecture.md)
components/               ← componentes compartilhados entre features deste app (sidebar, etc.)
lib/                       ← utilitários de app inteiro (db.ts, formatters.ts, safe-action.ts, ...)
hooks/                     ← hooks de app inteiro (use-debounced-external-lookup.ts, ...)
```

`@/*` aponta para a raiz de `apps/admin` (ex: `@/features/empresas/...`,
`@/lib/formatters`).

## Exemplo canônico: `features/empresas/`

Referência de como aplicar as regras de arquitetura/server-client/duplicação
neste app — comece por ali antes de estruturar uma feature nova
(`funcionarios`, `caixa`, `cardapio`, etc. hoje são só stubs em `app/`):

```
features/empresas/
  components/list/       ← tela de listagem (server, exceto a linha clicável)
  components/detail/     ← header + tabs + as 7 abas do detalhe
  components/detail/tabs/overview/  ← decomposição da aba "visão geral" (era 1 arquivo de 623 linhas)
  components/form/        ← drawer de cadastro (client — formulário é uma única unidade interativa)
  components/shared/      ← peças reusadas só dentro desta feature (TrendBadge, AtivoInativoBadge, ...)
  hooks/                   ← use-cnpj-lookup.ts, use-cep-lookup.ts
  lib/
    types.ts               ← tipos canônicos (sem sufixo "Mock")
    queries.ts              ← getEmpresas, getEmpresaById, getEmpresaDetail — hoje mock, `async` desde já
    actions.ts               ← "use server", next-safe-action — hoje simula, já estruturado como real
    schemas.ts                ← Zod, compartilhado entre form e action
    mock-data/                 ← só `queries.ts` importa (reforçado por eslint no-restricted-imports)
```

## React Compiler

Habilitado via `reactCompiler: true` em `next.config.js` — não escreva
`useMemo`/`useCallback` manual (ver `docs/rules/code-style.md`).

## Exemplo canônico de feature com banco real: `features/estoque/`

`features/empresas` é a referência de **arquitetura de pastas**;
`features/estoque` é a referência de **feature plugada no Postgres**. Copie
dali ao começar a Fase 2 (Financeiro) e a Fase 3 (RH):

```
features/estoque/
  lib/queries.ts             ← Drizzle real, `db.query.x.findMany({ with })` para evitar N+1
  lib/actions.ts             ← authActionClient + ActionError (mensagem chega no toast)
  lib/aplicar-movimento.ts   ← único caminho que altera saldo; devolve statements p/ `executarLote`
  lib/numeric.ts             ← numeric do Postgres vem como string; converte só aqui
  lib/*-helpers.ts           ← lógica pura, coberta por Vitest (38 testes)
```

Três coisas que valem para qualquer feature nova deste app:

- **`db.batch([...])`, não `db.transaction(cb)`.** O driver `neon-http` só tem
  transação não-interativa; a variante com callback lança em runtime. Leia e
  calcule antes, depois mande os statements prontos no lote — use
  `executarLote` de `lib/db-batch.ts`.
- **`numeric` chega como string.** Converta em `queries.ts` e devolva `number`
  nos tipos (`lib/numeric.ts`) — componente nenhum deve ver `"9.000"`.
- **Erro de action só aparece na tela se for `ActionError`** (`lib/safe-action.ts`).
  Qualquer outra exceção vira mensagem genérica de propósito, para não vazar
  detalhe de banco.

## Um módulo nunca escreve na tabela de outro

`features/compras` (Fase 2b) é o primeiro caso: registrar uma compra precisa
mexer em estoque e em financeiro. Ele **não** escreve em `estoque_movimento`
nem em `conta_a_pagar` por conta própria — pede para quem é dono da regra:

- `features/estoque/lib/aplicar-movimento.ts` → `planejarMovimento()`
- `features/financeiro/lib/planejar-conta.ts` → `planejarContaPagar()`

Os dois **devolvem statements, nunca executam** — o chamador junta tudo num
`executarLote` só. A dependência anda numa direção só (compras → estoque e
financeiro), e a regra de negócio de cada domínio continua num lugar só.

## Livro-razão: o padrão dos três módulos

`estoque_movimento` (Fase 1), `transacao_financeira` (Fase 2a) e `compra`
(Fase 2b) seguem a mesma ideia, e features novas que mexam com saldo devem
copiá-la:

- Uma tabela append-only é a **fonte única** do número derivado (saldo de item,
  DRE do mês). Nada soma "por fora".
- Um caminho de escrita só (`aplicar-movimento.ts` no estoque; a própria action
  no financeiro), sempre dentro de um `db.batch`, para o registro e o efeito
  nunca saírem de sincronia.
- Desfazer apaga o registro vinculado (`origem_tipo` + `origem_id`), sem deixar
  linha órfã inflando o total. **Onde o saldo é encadeado, não se desfaz**:
  receber uma compra e finalizar um inventário geram movimentos com
  `saldo_resultante`, e apagá-los faria todo movimento posterior daquele item
  mentir — a correção vira "Ajustar quantidade". Financeiro pode apagar porque
  `transacao_financeira` é uma lista plana que se soma.
- Estado que apodrece (estoque "baixo", conta "atrasada") é **derivado por
  query/helper**, nunca gravado — sem job para atualizar, dado gravado mente.

## Número que muda com o tempo vira linha, não coluna

`historico_preco_insumo` (estoque) e `historico_salario` (RH) são a mesma ideia:
o valor atual é **derivado** da última vigência `<= a data`, nunca gravado na
entidade. Sem isso, um reajuste de hoje reescreveria a folha de um mês já
fechado, e um preço novo mudaria o custo de uma compra antiga. `salarioVigenteEm`
em `features/rh/lib/salario-helpers.ts` é a implementação de referência.

## Dado pessoal: cifrado no banco, mascarado na tela, auditado na leitura

O CPF do funcionário interno é o primeiro caso (Fase 3) e o padrão para os
próximos:

- `lib/crypto.ts` (server-only) faz AES-256-GCM; `lib/cpf.ts` tem as funções
  puras de máscara e validação, que rodam também no cliente.
- A coluna guarda o cifrado + os últimos dígitos em claro, para exibir e buscar
  sem decifrar a tabela.
- `queries.ts` **nunca** devolve o valor completo. Ler é uma action própria que
  grava em `audit_log`.
- `CPF_ENCRYPTION_KEY` está em `.env.local` (gitignored) e declarada em
  `turbo.json`. Trocar a chave torna os dados já gravados ilegíveis.

## Datas: dia de calendário ≠ instante

`lib/formatters.ts` trata os dois casos separadamente, e isso não é detalhe:
`new Date('2026-11-08')` é meia-noite **UTC** e, formatado em Brasília (−3h),
volta um dia — 08/11 vira 07/11. Colunas `date` do Postgres são reordenadas
como texto, sem `Date` no caminho; só timestamp real passa por fuso. Coberto em
`lib/formatters.test.ts`.

## Testes

`pnpm --filter admin test` (Vitest, `environment: 'node'`). Os alvos são
helpers puros — filtro/ordenação/paginação, aritmética de saldo, diferença de
inventário, vigência de salário, criptografia. Componente não é testado aqui.

`server-only` lança fora de um Server Component, e o Vitest roda em node puro:
`vitest.config.ts` aliasa esse pacote para um stub (`test/server-only-stub.ts`)
para que módulos com a diretiva possam ser testados. A proteção continua
valendo no build.

## Dados ainda mock

`features/empresas` está 100% em cima de dados mock — a camada
`lib/queries.ts`/`lib/actions.ts` existe justamente para que a troca por
Drizzle real (`@repo/db`, `import { db } from "@/lib/db"`) seja uma mudança
isolada dentro desses arquivos, sem tocar em componente nenhum. Campos como
"funcionários que responderam", "envios", "faturamento" e "satisfação" não
têm tabela no schema hoje — só `empresa`, `empresa_contrato` e
`empresa_pausa_dia` existem em `packages/db/src/schema/empresa.ts`.
