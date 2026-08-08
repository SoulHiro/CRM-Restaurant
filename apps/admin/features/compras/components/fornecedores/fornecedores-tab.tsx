import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

import { EmptyState } from '@repo/ui/components/empty-state'
import { MobileCellLabel } from '@repo/ui/components/mobile-cell-label'
import { cn } from '@repo/ui/lib/utils'

import type { FornecedorListItem } from '../../lib/types'
import { FornecedorDrawer } from '../form/fornecedor-drawer'
import { NotaAvaliacao } from '../shared/nota-avaliacao'

const GRID_COLUMNS = 'sm:grid-cols-[2fr_1.4fr_1.2fr_1fr_3rem_2.5rem]'

export function FornecedoresTab({
  fornecedores,
}: {
  fornecedores: FornecedorListItem[]
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <FornecedorDrawer />
      </div>

      {fornecedores.length === 0 ? (
        <EmptyState message="Nenhum fornecedor cadastrado. Cadastre um para poder registrar compras e comparar preços." />
      ) : (
        <div
          role="table"
          aria-label="Fornecedores"
          className="flex flex-col gap-2"
        >
          <div
            role="row"
            className={cn(
              'hidden items-center gap-4 px-4 py-3 text-xs font-medium text-muted-foreground sm:grid',
              GRID_COLUMNS
            )}
          >
            <span role="columnheader">Fornecedor</span>
            <span role="columnheader">Avaliação</span>
            <span role="columnheader">Prazos</span>
            <span role="columnheader" className="text-right">
              Compras
            </span>
            <span role="columnheader" className="sr-only">
              Editar
            </span>
            <span role="columnheader" className="sr-only">
              Abrir
            </span>
          </div>

          {fornecedores.map((fornecedor) => (
            <div
              key={fornecedor.id}
              role="row"
              className={cn(
                'rounded-lg bg-card',
                'flex flex-col gap-2 p-4 sm:grid sm:items-center sm:gap-4 sm:py-3',
                GRID_COLUMNS
              )}
            >
              <span role="cell" className="flex min-w-0 flex-col">
                <span className="truncate font-medium">{fornecedor.nome}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {fornecedor.contato ?? 'sem contato'} · {fornecedor.qtdItens}{' '}
                  {fornecedor.qtdItens === 1 ? 'preço' : 'preços'} cadastrados
                </span>
              </span>

              <span
                role="cell"
                className="flex items-center justify-between gap-2 sm:block"
              >
                <MobileCellLabel>Avaliação</MobileCellLabel>
                <NotaAvaliacao nota={fornecedor.mediaAvaliacao} />
              </span>

              <span
                role="cell"
                className="flex items-center justify-between gap-2 text-sm text-muted-foreground sm:block"
              >
                <MobileCellLabel>Prazos</MobileCellLabel>
                <span className="text-right sm:text-left">
                  {fornecedor.prazoEntregaDias == null
                    ? 'entrega —'
                    : `entrega ${fornecedor.prazoEntregaDias}d`}
                  {' · '}
                  {fornecedor.prazoPagamento
                    ? `paga ${fornecedor.prazoPagamento}`
                    : 'paga à vista'}
                </span>
              </span>

              <span
                role="cell"
                className="flex items-center justify-between gap-2 text-sm tabular-nums sm:block sm:text-right"
              >
                <MobileCellLabel>Compras</MobileCellLabel>
                {fornecedor.qtdCompras}
              </span>

              <span role="cell" className="hidden justify-end sm:flex">
                <FornecedorDrawer fornecedor={fornecedor} />
              </span>

              <span role="cell" className="flex justify-end">
                <Link
                  href={`/compras/fornecedor/${fornecedor.id}`}
                  className="flex h-9 w-full items-center justify-center gap-2 rounded-md text-sm text-muted-foreground transition-colors hover:bg-muted focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none sm:w-9"
                >
                  <span className="sm:hidden">Abrir fornecedor</span>
                  <ChevronRight className="size-4" />
                </Link>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
