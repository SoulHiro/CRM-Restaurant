# crm-restaurant

Monorepo (pnpm workspaces + Turborepo) de um sistema de gestão para
restaurante ("Nosso Quintal").

```
apps/
  admin/   ← admin.nossoquintal.com.br (porta 3002 em dev)
  web/     ← nossoquintal.com.br
packages/
  db/      ← @repo/db — Drizzle ORM + Neon
  ui/      ← @repo/ui — shadcn/ui (style: new-york)
  auth/    ← @repo/auth — Better Auth (factory createAuth(db) por app)
  eslint-config/, typescript-config/
```

Comandos (raiz, via Turborepo — ou `--filter admin` / `--filter web` para um
app só):

```
pnpm dev
pnpm build
pnpm lint
pnpm check-types
pnpm format
```

## Regras do projeto

@docs/rules/architecture.md
@docs/rules/server-client-components.md
@docs/rules/code-style.md
@docs/rules/duplication-reusability.md

Essas regras se aplicam a todo código novo em qualquer app do monorepo. A
feature `features/empresas/` em `apps/admin` é a referência canônica de como
aplicá-las — veja `apps/admin/CLAUDE.md`.
