---
name: Nosso Quintal — Admin
description: Painel operacional para gestão de marmitas corporativas e canais de salão/delivery
colors:
  dourado-quintal: "#c9a227"
  dourado-300: "#e0b84d"
  dourado-100: "#f5e7b8"
  dourado-50: "#fbf3dc"
  bege-quente: "#d9c7a3"
  creme-quintal: "#f5ecd9"
  madeira-50: "#f5ede4"
  madeira-300: "#8f7350"
  madeira-400: "#4a3826"
  madeira-escura: "#2e2013"
  madeira-600: "#241909"
  destructive: "#ef4444"
typography:
  title:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "normal"
rounded:
  sm: "0.125rem"
  md: "0.375rem"
  lg: "0.5rem"
  xl: "0.75rem"
  full: "9999px"
spacing:
  xs: "0.5rem"
  sm: "0.75rem"
  md: "1rem"
  lg: "1.5rem"
components:
  button-primary:
    backgroundColor: "{colors.dourado-quintal}"
    textColor: "{colors.madeira-escura}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
    height: "2.25rem"
  button-primary-hover:
    backgroundColor: "{colors.dourado-quintal}"
  card:
    backgroundColor: "{colors.dourado-50}"
    textColor: "{colors.madeira-escura}"
    rounded: "{rounded.xl}"
    padding: "1.5rem"
  input:
    backgroundColor: "transparent"
    textColor: "{colors.madeira-escura}"
    rounded: "{rounded.md}"
    height: "2.25rem"
    padding: "0.5rem 0.75rem"
---

# Design System: Nosso Quintal — Admin

## Overview

**Creative North Star: "A Placa do Quintal"**

O sistema replica, em UI, a placa física de um restaurante: letras douradas sobre madeira escura. Isso não é metáfora solta — está literalmente no código (`packages/ui/src/styles/globals.css`: *"Sidebar — replica a placa física: dourado sobre madeira escura"*), e é o único elemento do sistema que não muda com o tema: a sidebar é madeira escura tanto no claro quanto no escuro, porque uma placa não "clareia" à noite.

Fora da sidebar, o resto da interface é uma superfície neutra e quente — creme e dourado-claro no tema claro, madeira ainda mais escura no tema escuro — pensada pra uso operacional sob pressão de horário, não pra vitrine. Sólido e funcional, sem floreio: cada sombra, cada cor de destaque, cada componente existe porque tem um trabalho a fazer (marcar estado, guiar ação primária, hierarquizar dado), nunca porque "fica bonito".

**Key Characteristics:**
- Placa física como âncora: dourado + madeira escura, sidebar constante nos dois temas
- Operate-mode primeiro: densidade de tabela/lista escaneável > expressão visual
- Estado sempre visível: badges e cores de status carregam a informação, não decoram
- Superfícies planas por padrão; sombra e elevação só aparecem em overlays temporários (dropdown, select, popover) ou painéis flutuantes (drawer)

## Colors

Paleta quente de dois materiais — dourado e madeira — nomeada com a mesma convenção já usada nos comentários do `globals.css` (`Dourado 500`, `Madeira 500`...).

### Primary
- **Dourado Quintal** (`#c9a227`): cor de ação — botão primário, foco de teclado (`ring`), borda de seleção do calendário, indicador de item "hoje". Constante nos dois temas; só o texto sobre ela inverte (madeira escura no claro, quase-preto no escuro).

### Secondary
- **Bege Quente** (`#d9c7a3`): borda padrão de inputs/cards no tema claro, botão secundário. Vira **Madeira 400** (`#4a3826`) no escuro — mesmo papel, material mais escuro.

### Neutral
- **Creme Quintal** (`#f5ecd9`): fundo da página no tema claro.
- **Dourado 50** (`#fbf3dc`): fundo de card/popover no tema claro — um degrau mais claro que o fundo da página, não mais escuro.
- **Madeira 50** (`#f5ede4`): superfície recuada (linha expandida, estado desabilitado) no tema claro.
- **Madeira 300** (`#8f7350`): texto secundário/muted no tema claro.
- **Madeira Escura** (`#2e2013`): texto principal no tema claro; fundo da sidebar nos dois temas; fundo da página no tema escuro passa a ser ainda mais escuro (`#1a1206`, não listado em frontmatter por ser um passo além da escala principal).

### Named Rules
**A Regra da Placa Constante.** A sidebar (`--sidebar`, `--sidebar-foreground`, etc.) nunca muda de valor entre os temas claro e escuro — ela é sempre madeira escura com texto creme. Todo o resto da interface (fundo, card, texto) inverte tom com o tema; a placa não.

**A Regra do Popover Sem Borda.** Overlays efêmeros (dropdown menu, select, popover) não têm borda — só `shadow-lg` sobre `bg-popover`. Superfícies persistentes maiores (drawer) mantêm borda + `shadow-2xl`. A diferença de peso visual reflete a diferença de permanência na tela.

## Typography

**Body/Título/Label Font:** Geist (`next/font/google`, com fallback `system-ui, sans-serif`)

**Character:** Uma família só, sem par serif/display — o sistema não precisa de voz editorial, precisa de leitura rápida em tabela e formulário.

### Hierarchy
- **Title** (600, 1rem, tracking -0.01em): título de card/seção (`CardTitle`) e título de drawer.
- **Body** (400, 0.875rem): texto corrido, valor de campo, conteúdo de tabela — a esmagadora maioria da UI.
- **Label** (500, 0.75rem): rótulo de campo (`FieldCell`), texto de badge, texto secundário/muted abaixo de um valor principal.

Não há uma escala "display"/"headline" no sistema — modo Operate não usa hero text.

## Layout

Shell fixo: sidebar à esquerda (`SidebarProvider` + `variant="inset"`, painel flutuante com padding e cantos arredondados) + header sticky com trigger de colapsar + separador vertical. Sidebar colapsa pra modo ícone (`collapsible="icon"`), nunca desaparece.

Conteúdo principal usa a escala de espaçamento padrão do Tailwind (`0.25rem` por unidade), sem grid customizado. Dois padrões de linha coexistem por design, escolhidos pelo peso da interação:
- **Tabela simples** (`Table`/`TableRow`): listas onde a linha é só leitura + 1-2 ações — ex. roster de Funcionários.
- **Linha-cartão** (`div role="row"` com `rounded-lg bg-card` + `gap-2` entre linhas): listas onde a linha carrega múltiplos estados/ações densos — ex. Empresas, Pausas, semanas de Histórico.

## Elevation & Depth

Majoritariamente plano. Cards descartam a borda padrão (`border-0`) mas mantêm a sombra base sutil do componente (`shadow`, não customizada). Controles interativos em repouso (botão exceto `ghost`/`link`, input, select) usam `shadow-sm`. Overlays temporários (dropdown, select, popover) usam `shadow-lg` sem borda (ver Regra do Popover Sem Borda). Painéis flutuantes (drawer, variante `float`) usam `shadow-2xl` com borda.

### Shadow Vocabulary
- **Repouso** (`shadow-sm`): botões preenchidos, inputs, select trigger.
- **Card** (`shadow`, valor padrão do Tailwind): superfície de card, sem borda.
- **Overlay** (`shadow-lg`): conteúdo de dropdown/select/popover, sem borda.
- **Painel flutuante** (`shadow-2xl`): drawer no modo `float`, com borda + `rounded-[10px]` + margem de 1rem em volta.

### Named Rules
**A Regra do Plano-em-Repouso.** Nada tem sombra pesada parado na tela. Peso visual (shadow-lg, shadow-2xl) é reservado pra elementos que estão temporariamente flutuando sobre o resto da UI — quando fecham, a sombra some com eles.

## Shapes

Cantos arredondados moderados em toda parte, sem esquadria reta em nenhum componente interativo: `rounded-md` (0.375rem) é o padrão de botão/input/select/badge; `rounded-xl` (0.75rem) é reservado pra card e linha-cartão; drawer flutuante usa `rounded-[10px]`, um valor próprio fora da escala padrão. Avatares são sempre círculo completo.

## Components

### Buttons
- **Shape:** `rounded-md`, altura `h-9` por padrão (`sm`/`lg`/`icon` como variantes de tamanho)
- **Primary:** fundo Dourado Quintal, texto Madeira Escura, `shadow-sm`
- **Secondary/Outline/Ghost:** fundo Bege Quente / borda + fundo transparente / sem fundo até hover
- **Todo botão é `cursor-pointer`** — corrigido nesta sessão como regra de todo o sistema, não só do componente Button (Tabs, Select, Checkbox, DropdownMenu items também ganharam `cursor-pointer` explicitamente)

### Badges
- **Style:** `rounded-md`, `px-2.5 py-0.5`, texto `text-xs font-semibold`
- **Uso de estado:** `default` (dourado) = ativo/vigente; `secondary` (bege/madeira) = inativo/neutro; `destructive` = erro

### Cards / Containers
- **Corner Style:** `rounded-xl`
- **Background:** Dourado 50 (claro) / Madeira 600 (escuro)
- **Shadow Strategy:** mantém `shadow` base, quase sempre com `border-0` aplicado pelo consumidor (ver Elevation & Depth)
- **Internal Padding:** `p-6` (header/content), `pt-0` no content quando segue um header

### Inputs / Fields
- **Style:** `h-9`, borda Bege Quente/Madeira 400, `shadow-sm`, fundo transparente
- **Focus:** anel de 1px na cor Dourado Quintal (`ring-1 ring-ring`)

### Navigation (Tabs)
- **Style:** `TabsList` em pílula (`rounded-lg bg-muted p-1`); `TabsTrigger` ativo ganha fundo `bg-background` + sombra sutil; `cursor-pointer` em todo trigger

### Linha-Cartão (signature)
Padrão custom usado quando uma linha de lista precisa carregar múltiplos estados/ações sem virar uma tabela sobrecarregada: `div role="row"` com `rounded-lg bg-card`, empilhadas com `gap-2` (nunca bordas entre linhas). Uma variante expansível existe (histórico de pedidos): o conteúdo revelado usa `bg-muted` como piso — nunca uma sobreposição preta arbitrária, sempre o token de superfície recuada do tema.

### Drawer (signature)
Painel de criar/editar em toda a aplicação (empresa, funcionário, pausa) entra pela direita como painel flutuante (`direction="right" variant="float"`): margem de 1rem, `rounded-[10px]`, `shadow-2xl`, com borda. Cabeçalho (`DrawerHeader`) + rodapé fixo com ações (`DrawerFooter`) — o formulário rola no meio.

## Do's and Don'ts

### Do:
- **Do** usar os tokens `dourado-*`/`madeira-*`/`bege-quente`/`creme-quintal` — nunca a paleta zinc padrão do shadcn.
- **Do** manter a sidebar em madeira escura constante, independente do tema ativo (Regra da Placa Constante).
- **Do** aplicar `cursor-pointer` em todo elemento clicável, mesmo quando o componente-base do Radix não inclui por padrão.
- **Do** remover a borda de overlays efêmeros (dropdown/select/popover) e usar só `shadow-lg` (Regra do Popover Sem Borda).

### Don't:
- **Don't** reintroduzir sombra pesada em elementos parados na tela — isso é reservado a overlays/painéis temporários (Regra do Plano-em-Repouso).
- **Don't** misturar o padrão de tabela simples com o de linha-cartão na mesma lista — a escolha entre os dois é por densidade de interação da linha, não por gosto.
- **Don't** usar dado mock (`packages/*/lib/mock-data`) como prova social ou exemplo real em nenhuma superfície — ver `PRODUCT.md` → Evidence on Hand.
