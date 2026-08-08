import { EmptyState } from '@repo/ui/components/empty-state'
import { MobileCellLabel } from '@repo/ui/components/mobile-cell-label'
import { cn } from '@repo/ui/lib/utils'

import { formatCurrencyBRL, formatDateBR } from '@/lib/formatters'
import type { CompraListItem } from '../../../lib/types'
import { StatusCompraBadge } from '../../shared/status-compra-badge'

const GRID_COLUMNS = 'sm:grid-cols-[1.4fr_1.2fr_1.2fr_1fr]'

export function ComprasFornecedorTab({
  compras,
}: {
  compras: CompraListItem[]
}) {
  if (compras.length === 0) {
    return (
      <EmptyState message="Nenhuma compra deste fornecedor ainda." />
    )
  }

  return (
    <div
      role="table"
      aria-label="Compras deste fornecedor"
      className="flex flex-col gap-2"
    >
      <div
        role="row"
        className={cn(
          'hidden items-center gap-4 px-4 py-3 text-xs font-medium text-muted-foreground sm:grid',
          GRID_COLUMNS
        )}
      >
        <span role="columnheader">Nota</span>
        <span role="columnheader">Situação</span>
        <span role="columnheader">Pedido em</span>
        <span role="columnheader" className="text-right">
          Total
        </span>
      </div>

      {compras.map((compra) => (
        <div
          key={compra.id}
          role="row"
          className={cn(
            'rounded-lg bg-card',
            'flex flex-col gap-2 p-4 sm:grid sm:items-center sm:gap-4 sm:py-3',
            GRID_COLUMNS,
            compra.status === 'cancelado' && 'opacity-60'
          )}
        >
          <span role="cell" className="flex min-w-0 flex-col">
            <span className="truncate font-medium">
              {compra.numeroNotaFiscal
                ? `Nota ${compra.numeroNotaFiscal}`
                : 'Sem número de nota'}
            </span>
            <span className="text-xs text-muted-foreground">
              {compra.qtdItens} {compra.qtdItens === 1 ? 'item' : 'itens'}
            </span>
          </span>

          <span
            role="cell"
            className="flex items-center justify-between gap-2 sm:block"
          >
            <MobileCellLabel>Situação</MobileCellLabel>
            <StatusCompraBadge
              status={compra.status}
              atrasada={compra.entregaAtrasada}
            />
          </span>

          <span
            role="cell"
            className="flex items-center justify-between gap-2 text-sm tabular-nums sm:block"
          >
            <MobileCellLabel>Pedido em</MobileCellLabel>
            {formatDateBR(compra.dataPedido)}
          </span>

          <span
            role="cell"
            className="flex items-center justify-between gap-2 text-sm font-medium tabular-nums sm:block sm:text-right"
          >
            <MobileCellLabel>Total</MobileCellLabel>
            {formatCurrencyBRL(compra.total)}
          </span>
        </div>
      ))}
    </div>
  )
}
