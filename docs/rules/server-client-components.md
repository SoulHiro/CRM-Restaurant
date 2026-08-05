# Server vs. Client Components

## A fronteira `"use client"` é atômica, não por wrapper

Não crie um Server Component que só serve para importar um único Client
Component gigante contendo tudo. Empurre `"use client"` para a menor unidade
que realmente precisa de interatividade.

Exemplo: uma tela renderiza vários cards buscados do banco. O Server
Component faz o fetch e renderiza os cards; só o controle *interno* de um
card que realmente precisa de interação (um botão, um gráfico) é Client
Component — não o card inteiro.

Ruim (estado real de `visao-geral-tab.tsx` antes deste refactor: 623 linhas,
`"use client"` no topo do arquivo inteiro, embora só 2 dos 9 cards da tela
usassem algo que exige client):

```tsx
"use client"
export function VisaoGeralTab(props) {
  // 9 cards, a maioria 100% estática, todos presos em client
  // porque 2 deles usam <BarChart> do recharts
}
```

Bom (depois do refactor): `overview-tab.tsx` é Server Component; só
`respostas-por-dia-chart.tsx` e `pedidos-enviados-chart.tsx` (os dois únicos
pedaços que renderizam JSX do recharts diretamente) têm `"use client"`. Os
outros 7 cards — incluindo dois SVGs artesanais que pareciam "complexos" —
são puro HTML/CSS derivado de props e ficam no servidor.

## Composição não propaga a fronteira

Importar um Client Component (`Avatar`, `Tabs`, `Badge` do `@repo/ui`) dentro
de um arquivo server **não obriga esse arquivo a virar client**. A regra do
React Server Components é: um Server Component pode renderizar Client
Components como filhos livremente. Só adicione `"use client"` no seu próprio
arquivo quando ele mesmo usa hooks (`useState`, `useEffect`, ...), APIs de
browser, handlers de evento, ou renderiza diretamente o JSX de uma lib que não
declara `"use client"` própria.

`recharts` é o exemplo concreto neste projeto: `BarChart`, `AreaChart` e
companhia não têm `"use client"` embutido, então **o arquivo que escreve esse
JSX diretamente** precisa da diretiva — não dá para "herdar" de um componente
pai. Por isso todo gráfico vive isolado em seu próprio arquivo pequeno
(`components/shared/faturamento-bar-chart.tsx`,
`components/detail/tabs/overview/respostas-por-dia-chart.tsx`, etc.), e o
`Card` ao redor dele fica no servidor.

## Quando a unidade inteira é a parte interativa

Nem toda "menor unidade" é minúscula. Uma linha de tabela inteira sendo o
alvo de clique (`empresa-table-row.tsx`, que usa `useRouter` +
`onKeyDown` no `div` da linha toda) ou um formulário com vários campos
interdependentes (`cadastrar-empresa-form.tsx`, com `react-hook-form` +
lookups debounced) são, legitimamente, um único Client Component — dividir
esses casos em arquivos menores é sobre **tamanho de arquivo**
(ver [[architecture]]), não sobre empurrar a fronteira client mais para
baixo, porque não existe uma sub-parte estática para isolar.
