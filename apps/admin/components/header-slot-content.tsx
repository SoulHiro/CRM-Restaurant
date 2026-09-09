'use client'

import { useHeaderSlotContent } from './header-slot'

/**
 * Único pedaço client de `SiteHeader` — lê o que a página atual publicou via
 * `SetHeaderContent` (ver `header-slot.tsx`) e renderiza nas três regiões do
 * header genérico. Nada aqui sabe o que é "empresa" ou qualquer outra
 * feature — só encaixa o `ReactNode` que já veio pronto.
 *
 * `center` é posicionado em relação ao `<header>` inteiro (via `absolute` +
 * `left-1/2`), não à área que sobra entre `left` e `right` — como as duas
 * pontas quase nunca têm a mesma largura, centralizar só no espaço restante
 * deixaria o texto visualmente puxado pra um lado. `<header>` precisa ser
 * `relative` pra isso funcionar (ver `site-header.tsx`).
 */
export function HeaderSlotContent() {
  const { left, center, right } = useHeaderSlotContent()

  return (
    <>
      {left}
      {center && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="pointer-events-auto">{center}</div>
        </div>
      )}
      <div className="ml-auto flex items-center gap-1">{right}</div>
    </>
  )
}
