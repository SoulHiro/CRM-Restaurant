import { EmptyState } from '@repo/ui/components/empty-state'
import { cn } from '@repo/ui/lib/utils'

import type { EstoqueItem } from '@/features/estoque/lib/types'
import { filtrarCompras, type CompraFiltro } from '../../lib/compra-helpers'
import type { CompraNaLista, FornecedorListItem } from '../../lib/types'
import { CompraDrawer } from '../form/compra-drawer'
import { CompraRow, COMPRA_GRID } from './compra-row'
import { ComprasFiltro } from './compras-filtro'

export function ComprasTab({
  compras,
  fornecedores,
  itens,
  precosPorFornecedor,
  filtro,
  hoje,
}: {
  compras: CompraNaLista[]
  fornecedores: FornecedorListItem[]
  itens: EstoqueItem[]
  precosPorFornecedor: Record<string, number>
  filtro: CompraFiltro
  hoje: string
}) {
  const visiveis = filtrarCompras(compras, { status: filtro })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <ComprasFiltro filtro={filtro} />
        <CompraDrawer
          hoje={hoje}
          fornecedores={fornecedores}
          itens={itens}
          precosPorFornecedor={precosPorFornecedor}
        />
      </div>

      {visiveis.length === 0 ? (
        <EmptyState
          message={
            compras.length === 0
              ? fornecedores.length === 0
                ? 'Cadastre um fornecedor primeiro — a compra sai dele, com prazo de entrega e de pagamento já preenchidos.'
                : 'Nenhuma compra registrada. Cada nota lançada aqui vira conta a pagar e entrada de estoque sozinha.'
              : 'Nenhuma compra com esse filtro.'
          }
        />
      ) : (
        <div
          role="table"
          aria-label="Compras registradas"
          className="flex flex-col gap-2"
        >
          <div
            role="row"
            className={cn(
              'hidden items-center gap-4 px-4 py-3 text-xs font-medium text-muted-foreground sm:grid',
              COMPRA_GRID
            )}
          >
            <span role="columnheader">Fornecedor</span>
            <span role="columnheader">Situação</span>
            <span role="columnheader">Pedido em</span>
            <span role="columnheader" className="text-right">
              Total
            </span>
            <span role="columnheader" className="sr-only">
              Receber
            </span>
            <span role="columnheader" className="sr-only">
              Cancelar
            </span>
            <span role="columnheader" className="sr-only">
              Itens
            </span>
          </div>

          {visiveis.map((compra) => (
            <CompraRow key={compra.id} compra={compra} hoje={hoje} />
          ))}
        </div>
      )}
    </div>
  )
}
