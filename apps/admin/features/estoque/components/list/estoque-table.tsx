import { EmptyState } from '@repo/ui/components/empty-state'
import { cn } from '@repo/ui/lib/utils'

import type { EstoqueItem } from '../../lib/types'
import { EstoqueRow } from './estoque-row'

const GRID_COLUMNS = 'sm:grid-cols-[2.4fr_1.2fr_1fr_1.2fr]'
const ROW_LAYOUT = 'flex flex-col gap-2 p-4 sm:grid sm:items-center sm:gap-4 sm:py-3'

export function EstoqueTable({
  itens,
  hoje,
  vazioMensagem,
}: {
  itens: EstoqueItem[]
  hoje: string
  vazioMensagem: string
}) {
  if (itens.length === 0) {
    return <EmptyState message={vazioMensagem} />
  }

  return (
    <div
      role="table"
      aria-label="Itens de estoque"
      className="flex flex-col gap-2"
    >
      <div
        role="row"
        className={cn(
          'hidden items-center gap-4 px-4 py-3 text-xs font-medium text-muted-foreground sm:grid',
          GRID_COLUMNS
        )}
      >
        <span role="columnheader">Item</span>
        <span role="columnheader" className="text-right">
          Quantidade
        </span>
        <span role="columnheader" className="text-right">
          Repor em
        </span>
        <span role="columnheader">Validade</span>
      </div>

      {itens.map((item) => (
        <EstoqueRow
          key={item.id}
          item={item}
          hoje={hoje}
          className={cn(ROW_LAYOUT, GRID_COLUMNS)}
        />
      ))}
    </div>
  )
}
