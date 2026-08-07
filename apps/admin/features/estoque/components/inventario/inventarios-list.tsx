import Link from 'next/link'

import { Badge } from '@repo/ui/components/badge'
import { EmptyState } from '@repo/ui/components/empty-state'
import { cn } from '@repo/ui/lib/utils'

import { formatDateBR } from '@/lib/formatters'
import type { InventarioResumo } from '../../lib/types'
import { MobileCellLabel } from '../shared/mobile-cell-label'

const GRID_COLUMNS = 'sm:grid-cols-[1fr_1.4fr_1fr_1fr_1fr]'

export function InventariosList({
  inventarios,
}: {
  inventarios: InventarioResumo[]
}) {
  if (inventarios.length === 0) {
    return (
      <EmptyState message="Nenhuma contagem ainda. A primeira já mostra onde o sistema e a prateleira discordam." />
    )
  }

  return (
    <div
      role="table"
      aria-label="Contagens de inventário"
      className="flex flex-col gap-2"
    >
      <div
        role="row"
        className={cn(
          'hidden items-center gap-4 px-4 py-3 text-xs font-medium text-muted-foreground sm:grid',
          GRID_COLUMNS
        )}
      >
        <span role="columnheader">Data</span>
        <span role="columnheader">Responsável</span>
        <span role="columnheader" className="text-right">
          Contados
        </span>
        <span role="columnheader" className="text-right">
          Divergências
        </span>
        <span role="columnheader">Situação</span>
      </div>

      {inventarios.map((inventario) => (
        <Link
          key={inventario.id}
          href={`/estoque/inventario/${inventario.id}`}
          role="row"
          className={cn(
            'flex flex-col gap-2 rounded-lg bg-card p-4 transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:grid sm:items-center sm:gap-4 sm:py-3',
            GRID_COLUMNS
          )}
        >
          <span
            role="cell"
            className="flex items-center justify-between gap-2 sm:block"
          >
            <span className="text-sm font-medium tabular-nums">
              {formatDateBR(inventario.data)}
            </span>
            <Badge
              variant={
                inventario.status === 'em_andamento' ? 'default' : 'secondary'
              }
              className="sm:hidden"
            >
              {inventario.status === 'em_andamento'
                ? 'Em andamento'
                : 'Finalizada'}
            </Badge>
          </span>

          <span role="cell" className="truncate text-sm">
            {inventario.responsavel}
          </span>

          <span
            role="cell"
            className="flex items-center justify-between gap-2 text-sm tabular-nums sm:block sm:text-right"
          >
            <MobileCellLabel>Contados</MobileCellLabel>
            {inventario.linhasContadas}/{inventario.totalLinhas}
          </span>

          <span
            role="cell"
            className={cn(
              'flex items-center justify-between gap-2 text-sm font-medium tabular-nums sm:block sm:text-right',
              inventario.linhasDivergentes > 0
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-muted-foreground'
            )}
          >
            <MobileCellLabel>Divergências</MobileCellLabel>
            {inventario.linhasDivergentes}
          </span>

          <span role="cell" className="hidden sm:block">
            <Badge
              variant={
                inventario.status === 'em_andamento' ? 'default' : 'secondary'
              }
            >
              {inventario.status === 'em_andamento'
                ? 'Em andamento'
                : 'Finalizada'}
            </Badge>
          </span>
        </Link>
      ))}
    </div>
  )
}
