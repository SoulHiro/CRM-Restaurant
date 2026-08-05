# Arquitetura de pastas

## `app/` contém só rotas

Dentro de `app/`, só existem os arquivos que o Next.js exige para roteamento:
`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `route.ts`.
Nenhum componente, hook, helper ou tipo vive dentro de `app/`.

Ruim (estado real da feature `empresas` antes deste refactor — um componente de
497 linhas direto na pasta de rota):

```
apps/admin/app/(dashboard)/empresas/cadastrar-empresa-drawer.tsx
```

Bom:

```
apps/admin/app/(dashboard)/empresas/page.tsx
  → import { CadastrarEmpresaDrawer } from "@/features/empresas/components/form/cadastrar-empresa-drawer"
```

Uma `page.tsx` deve ser pequena: busca dados (via `lib/queries.ts` da feature) e
compõe componentes importados de `features/`. Nada de lógica de UI, formatação
ou fetch inline.

## Pasta de feature

Tudo que não é rota vive em `apps/admin/features/<nome>/`, com só as
subpastas que a feature realmente usa:

```
features/<nome>/
  components/   — organizados por tela/seção (ex: list/, detail/, form/, shared/)
  hooks/        — hooks específicos da feature
  lib/          — types, queries, actions, schemas, helpers puros
```

Não crie `stores/`, `services/`, `models/` etc. "porque outras features têm" —
só adicione uma subpasta quando o conteúdo dela existir de fato. Uma feature
sem estado de cliente compartilhado não precisa de `stores/`; uma sem
validação própria não precisa de `schemas.ts` separado de `lib/`.

Componentes compartilhados **dentro da mesma feature** (usados por 2+ telas
daquela feature, mas ainda específicos dela) vão em `components/shared/`.
Componentes genéricos sem nenhum acoplamento de negócio (ver
[[duplication-reusability]]) sobem para `@repo/ui`.

## Camada de dados: `lib/queries.ts` e `lib/actions.ts`

Toda leitura de dados do servidor passa por uma função nomeada em
`lib/queries.ts`. Toda escrita passa por uma Server Action em `lib/actions.ts`
(`"use server"`, via `next-safe-action`). Nenhum componente ou página importa
dado bruto (mock ou não) diretamente — só `queries.ts` pode.

Funções de `queries.ts` são sempre `async`/retornam `Promise`, mesmo que a
implementação atual seja síncrona (ex: um array mock). Isso garante que trocar
mock por uma query real do Drizzle depois seja uma mudança de uma linha, sem
tocar em nenhum componente:

```ts
// features/empresas/lib/queries.ts
import 'server-only'

export async function getEmpresas(): Promise<EmpresaListItem[]> {
  return mockEmpresas // troca futura: return db.select().from(empresa)
}
```

```tsx
// app/(dashboard)/empresas/page.tsx
const empresas = await getEmpresas()
```

Arquivos de dado bruto (`lib/mock-data/*`) usam `import "server-only"` e só
são importados por `lib/queries.ts` — isso é reforçado por lint, veja
`apps/admin/eslint.config.js` (regra `no-restricted-imports` bloqueando
imports de `**/mock-data/*` fora de `lib/queries.ts`).

Actions seguem o mesmo princípio: já nascem como Server Actions reais (com
`next-safe-action`, schema compartilhado com o form via Zod), mesmo que o
corpo hoje só simule a operação com um `// TODO(db): ...`. Trocar a simulação
por `db.insert(...)` real não muda a assinatura nem o componente que chama.

## Tamanho de arquivo

Componente/arquivo passando de ~300-400 linhas é sinal de que ele está
fazendo mais de uma coisa. Extraia sub-componentes, hooks ou helpers puros
para arquivos próprios antes de crescer além disso. Veja
[[server-client-components]] para como isso geralmente também resolve a
questão de fronteira client/server.
