import { EmptyState } from '@repo/ui/components/empty-state'
import { MobileCellLabel } from '@repo/ui/components/mobile-cell-label'
import { cn } from '@repo/ui/lib/utils'

import type { EstoqueItem } from '@/features/estoque/lib/types'
import { formatCurrencyBRL } from '@/lib/formatters'
import type { FornecedorItemPreco } from '../../../lib/types'
import { FornecedorItemDrawer } from '../../form/fornecedor-item-drawer'
import { RemoverPrecoButton } from './remover-preco-button'

const GRID_COLUMNS = 'sm:grid-cols-[2fr_1fr_1fr_2.5rem_2.5rem]'

export function ItensTab({
  fornecedorId,
  ofertas,
  itens,
}: {
  fornecedorId: string
  ofertas: FornecedorItemPreco[]
  itens: EstoqueItem[]
}) {
  const naoCadastrados = itens.filter(
    (item) => !ofertas.some((oferta) => oferta.estoqueItemId === item.id)
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <FornecedorItemDrawer
          fornecedorId={fornecedorId}
          itens={naoCadastrados}
        />
      </div>

      {ofertas.length === 0 ? (
        <EmptyState message="Nenhum preço cadastrado. Com os preços aqui, o valor unitário já vem preenchido ao lançar a compra." />
      ) : (
        <div
          role="table"
          aria-label="Preços deste fornecedor"
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
              Preço
            </span>
            <span role="columnheader" className="text-right">
              Entrega
            </span>
            <span role="columnheader" className="sr-only">
              Editar
            </span>
            <span role="columnheader" className="sr-only">
              Remover
            </span>
          </div>

          {ofertas.map((oferta) => (
            <div
              key={oferta.id}
              role="row"
              className={cn(
                'rounded-lg bg-card',
                'flex flex-col gap-2 p-4 sm:grid sm:items-center sm:gap-4 sm:py-3',
                GRID_COLUMNS
              )}
            >
              <span role="cell" className="flex min-w-0 flex-col">
                <span className="truncate font-medium">{oferta.itemNome}</span>
                {oferta.observacao && (
                  <span className="truncate text-xs text-muted-foreground">
                    {oferta.observacao}
                  </span>
                )}
              </span>

              <span
                role="cell"
                className="flex items-center justify-between gap-2 text-sm font-medium tabular-nums sm:block sm:text-right"
              >
                <MobileCellLabel>Preço</MobileCellLabel>
                {formatCurrencyBRL(oferta.preco)}
              </span>

              <span
                role="cell"
                className="flex items-center justify-between gap-2 text-sm text-muted-foreground tabular-nums sm:block sm:text-right"
              >
                <MobileCellLabel>Entrega</MobileCellLabel>
                {oferta.prazoEntregaDias == null
                  ? '—'
                  : `${oferta.prazoEntregaDias}d`}
              </span>

              <span role="cell" className="flex justify-end">
                <FornecedorItemDrawer
                  fornecedorId={fornecedorId}
                  itens={itens}
                  oferta={oferta}
                />
              </span>

              <span role="cell" className="flex justify-end">
                <RemoverPrecoButton id={oferta.id} itemNome={oferta.itemNome} />
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
