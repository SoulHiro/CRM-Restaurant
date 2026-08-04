# Design

## Visual Theme

shadcn/ui, estilo "new-york", cor base "zinc". Tema claro por padrão (`defaultTheme="light"` via next-themes), com suporte a dark mode. Superfície neutra e sóbria — sem gradientes, sem glassmorphism, sombras discretas (`shadow-sm`) só em elementos interativos (botões, inputs, dropdowns).

## Color Palette

Definido em `packages/ui/src/styles/globals.css`, compartilhado entre os apps `admin` e `web`.

| Token | Light | Dark |
|---|---|---|
| `--background` | `#ffffff` | `#09090b` |
| `--foreground` | `#171717` | `#fafafa` |
| `--card` | `#ffffff` | `#09090b` |
| `--primary` | `#18181b` | `#fafafa` |
| `--primary-foreground` | `#fafafa` | `#18181b` |
| `--secondary` / `--muted` / `--accent` | `#f4f4f5` | `#27272a` |
| `--muted-foreground` | `#71717a` | `#a1a1aa` |
| `--destructive` | `#ef4444` | `#7f1d1d` |
| `--border` / `--input` | `#e4e4e7` | `#27272a` |
| `--ring` | `#18181b` | `#d4d4d8` |
| `--sidebar` | `#fafafa` | `#18181b` |

Sem cor de destaque adicional além da escala zinc — acentos de estado (sucesso, alerta, pendência) ainda não têm token dedicado; usar `--destructive` para erro e compor amarelo/verde pontualmente até definirmos tokens formais de status.

## Typography

- Fonte única: **Geist** (`next/font/google`), aplicada globalmente via `geistSans.className` no `<body>`
- Sem fonte serif ou mono dedicada em uso ainda (mono só nos `font-mono` utilitários do Tailwind, não aplicado a nenhum componente hoje)
- Escala via utilitários Tailwind padrão (`text-sm`, `text-xl`, `text-2xl`...), sem escala customizada

## Components

Biblioteca em `packages/ui/src/components/` (shadcn oficial, instalado via CLI — não hand-rolled): `button`, `card`, `input`, `label`, `sidebar`, `avatar`, `badge`, `breadcrumb`, `chart`, `checkbox`, `drawer`, `dropdown-menu`, `select`, `separator`, `sheet`, `skeleton`, `sonner`, `table`, `tabs`, `toggle`, `toggle-group`, `tooltip`.

- Botões: `rounded-md`, altura `h-9` (default), variantes `default | destructive | outline | secondary | ghost | link`
- Inputs: `h-9`, `border-input`, `shadow-sm`, foco via `ring-1 ring-ring`
- Sidebar: variante `inset` (painel flutuante com padding, cantos arredondados), colapsável em modo ícone (`collapsible="icon"`), com `SidebarTrigger` + `SidebarRail`

## Layout

- App shell: sidebar fixa à esquerda (`SidebarProvider` + `AppSidebar` + `SidebarInset`), header sticky com `SidebarTrigger` + separador vertical
- Sem grid customizado além do Tailwind padrão; espaçamento via escala `spacing` padrão (`0.25rem` por unidade)

## Motion

Nenhum padrão de motion definido ainda além das transições default do Radix (dropdown, sheet, tooltip — `data-[state=open]:animate-in` / `fade-in` / `zoom-in`). Sidebar usa `transition-[width] duration-200 ease-linear` para expandir/colapsar.

## Known gaps

- `ThemeProvider` usa `attribute="class"` (next-themes), mas os tokens de dark mode em `globals.css` só respondem a `@media (prefers-color-scheme: dark)`, não a uma classe `.dark` — um toggle manual de tema não teria efeito hoje. Não corrigido ainda, fora do escopo da tarefa atual.
- Sem tokens de cor de status (sucesso/alerta/pendência) — precisa ser definido quando telas com badges de status (ex: "Aguardando respostas" / "Finalizado") entrarem em produção.
