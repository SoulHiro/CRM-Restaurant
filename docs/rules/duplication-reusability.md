# Duplicação e reuso

Antes de escrever uma segunda versão de um componente/helper, procure se já
existe um em, nessa ordem: `components/shared/` da feature atual →
`apps/admin/lib` / `apps/admin/hooks` / `apps/admin/components` →
`@repo/ui`.

## Onde cada tipo de coisa deve viver

| Tipo                                                                   | Destino                                    | Critério                                                                                                                                                                                                                                                                                                                           |
| ---------------------------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Componente de UI sem nenhum acoplamento a domínio/negócio              | `packages/ui/src/components/` (`@repo/ui`) | Ex: `PersonAvatar` (avatar + iniciais), `StatCard` (label + valor + slot), `FieldCell` (label + valor empilhado), `EmptyState`. Nenhum desses sabe o que é uma "empresa" ou um "funcionário".                                                                                                                                      |
| Utilitário de app inteiro (locale, formatação, base de infraestrutura) | `apps/admin/lib/`, `apps/admin/hooks/`     | Ex: `formatCurrencyBRL`/`formatDateBR` (pt-BR é uma decisão do app, não do design system), `safe-action.ts` (client base do `next-safe-action`, toda feature futura vai precisar), `use-debounced-external-lookup.ts` (mecânica de debounce+AbortController+toast é genérica; o mapeamento de campos de uma API específica não é). |
| Específico de uma feature, usado por 2+ telas dela                     | `features/<nome>/components/shared/`       | Ex: `TrendBadge`, `LegendDot`, `AtivoInativoBadge` — carregam semântica da feature (percentual de variação semanal, badge ativo/inativo de empresa) ou só têm um consumidor hoje. Promova para `@repo/ui` quando uma **segunda feature** precisar da mesma coisa — não antes (evita generalizar em cima de uma amostra de 1).      |
| Específico de uma tela/seção só                                        | `features/<nome>/components/<tela>/`       | Sem promoção nenhuma — é local mesmo.                                                                                                                                                                                                                                                                                              |

## Exemplo concreto (feature `empresas`)

Antes do refactor, `FieldCell`, `StatCard`, o padrão `Avatar+AvatarFallback+
getInitials` e os formatters de moeda/data estavam duplicados em 3 a 6
arquivos cada, com pequenas divergências entre as cópias (ex: um `FieldCell`
tinha fallback `|| "—"` e o outro não). Depois:

- `PersonAvatar`, `StatCard`, `FieldCell`, `EmptyState` → `@repo/ui`.
- `formatCurrencyBRL`, `formatDateBR`, `formatShortDateBR` → `apps/admin/lib/formatters.ts`.
- `TrendBadge`, `LegendDot`, `AtivoInativoBadge` → `features/empresas/components/shared/`.

## Regra prática

Três linhas parecidas em dois lugares não é motivo para criar uma
abstração — pode ser coincidência. A mesma peça de UI com o mesmo formato
usada em 2+ lugares dentro da mesma feature já justifica extrair para
`components/shared/`. Só sobe para `@repo/ui` quando uma feature **diferente**
também precisa — reuso real, não hipotético.
