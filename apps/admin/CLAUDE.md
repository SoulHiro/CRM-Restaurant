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

## Dados ainda mock

`features/empresas` está 100% em cima de dados mock — a camada
`lib/queries.ts`/`lib/actions.ts` existe justamente para que a troca por
Drizzle real (`@repo/db`, `import { db } from "@/lib/db"`) seja uma mudança
isolada dentro desses arquivos, sem tocar em componente nenhum. Campos como
"funcionários que responderam", "envios", "faturamento" e "satisfação" não
têm tabela no schema hoje — só `empresa`, `empresa_contrato` e
`empresa_pausa_dia` existem em `packages/db/src/schema/empresa.ts`.
