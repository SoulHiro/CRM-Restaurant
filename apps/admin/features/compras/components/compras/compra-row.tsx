'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

import { MobileCellLabel } from '@repo/ui/components/mobile-cell-label'
import { cn } from '@repo/ui/lib/utils'

import { SUBTIPO_LABELS } from '@/features/financeiro/lib/dre-helpers'
import { formatCurrencyBRL, formatDateBR } from '@/lib/formatters'
import type { CompraNaLista } from '../../lib/types'
import { StatusCompraBadge } from '../shared/status-compra-badge'
import { CancelarCompraButton } from './cancelar-compra-button'
import { ReceberCompraButton } from './receber-compra-button'

export const COMPRA_GRID = 'sm:grid-cols-[2.2fr_1.2fr_1.1fr_1fr_7rem_2.5rem_2.5rem]'

export function CompraRow({
  compra,
  hoje,
}: {
  compra: CompraNaLista
  hoje: string
}) {
  const [aberta, setAberta] = useState(false)

  return (
    <div
      className={cn(
        'rounded-lg bg-card',
        compra.status === 'cancelado' && 'opacity-60'
      )}
    >
      <div
        role="row"
        className={cn(
          'flex flex-col gap-2 p-4 sm:grid sm:items-center sm:gap-4 sm:py-3',
          COMPRA_GRID
        )}
      >
        <span role="cell" className="flex min-w-0 flex-col">
          <span className="truncate font-medium">{compra.fornecedorNome}</span>
          <span className="text-xs text-muted-foreground">
            {compra.numeroNotaFiscal
              ? `Nota ${compra.numeroNotaFiscal} · `
              : ''}
            {SUBTIPO_LABELS[compra.categoriaDespesa]}
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
          className="flex items-center justify-between gap-2 sm:flex-col sm:items-start sm:gap-0.5"
        >
          <MobileCellLabel>Pedido em</MobileCellLabel>
          <span className="flex flex-col items-end sm:items-start">
            <span className="text-sm tabular-nums">
              {formatDateBR(compra.dataPedido)}
            </span>
            {compra.dataRecebimento && (
              <span className="text-xs text-muted-foreground">
                recebido {formatDateBR(compra.dataRecebimento)}
              </span>
            )}
          </span>
        </span>

        <span
          role="cell"
          className="flex items-center justify-between gap-2 text-sm font-medium tabular-nums sm:block sm:text-right"
        >
          <MobileCellLabel>Total</MobileCellLabel>
          {formatCurrencyBRL(compra.total)}
        </span>

        <span role="cell">
          <ReceberCompraButton
            id={compra.id}
            status={compra.status}
            qtdItens={compra.qtdItens}
            hoje={hoje}
          />
        </span>

        <span role="cell" className="hidden justify-end sm:flex">
          <CancelarCompraButton id={compra.id} status={compra.status} />
        </span>

        <span role="cell" className="flex justify-end">
          <button
            type="button"
            aria-expanded={aberta}
            aria-label={
              aberta
                ? `Esconder itens da compra de ${compra.fornecedorNome}`
                : `Ver os ${compra.qtdItens} itens da compra de ${compra.fornecedorNome}`
            }
            onClick={() => setAberta((valor) => !valor)}
            className="flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-md text-sm text-muted-foreground transition-colors hover:bg-muted focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none sm:w-9"
          >
            <span className="sm:hidden">
              {compra.qtdItens} {compra.qtdItens === 1 ? 'item' : 'itens'}
            </span>
            <ChevronDown
              className={cn(
                'size-4 transition-transform duration-200',
                aberta && 'rotate-180'
              )}
            />
          </button>
        </span>
      </div>

      {aberta && (
        <div className="rounded-b-lg bg-muted px-4 py-3">
          <ul className="flex flex-col gap-1.5">
            {compra.linhas.map((linha) => (
              <li
                key={linha.id}
                className="flex items-baseline justify-between gap-4 text-sm"
              >
                <span className="min-w-0 truncate">
                  {linha.itemNome}
                  <span className="ml-2 text-xs text-muted-foreground tabular-nums">
                    {linha.quantidade} {linha.unidade} ×{' '}
                    {formatCurrencyBRL(linha.valorUnitario)}
                  </span>
                </span>
                <span className="shrink-0 font-medium tabular-nums">
                  {formatCurrencyBRL(linha.total)}
                </span>
              </li>
            ))}
          </ul>

          {compra.observacao && (
            <p className="mt-3 text-xs text-muted-foreground">
              {compra.observacao}
            </p>
          )}

          <div className="mt-3 flex justify-end sm:hidden">
            <CancelarCompraButton id={compra.id} status={compra.status} />
          </div>
        </div>
      )}
    </div>
  )
}
