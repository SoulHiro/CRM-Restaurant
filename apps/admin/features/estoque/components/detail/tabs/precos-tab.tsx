import { EmptyState } from '@repo/ui/components/empty-state'
import { StatCard } from '@repo/ui/components/stat-card'
import { cn } from '@repo/ui/lib/utils'

import {
  formatCurrencyBRL,
  formatDateBR,
  formatPercentBR,
} from '@/lib/formatters'
import type { PrecoInsumo, Unidade } from '../../../lib/types'
import { MobileCellLabel } from '@repo/ui/components/mobile-cell-label'

const GRID_COLUMNS = 'sm:grid-cols-[1fr_1fr_1fr_1.4fr]'

function variacaoPercentual(atual: number, anterior: number): number | null {
  if (anterior === 0) return null
  return Math.round(((atual - anterior) / anterior) * 1000) / 10
}

export function PrecosTab({
  precos,
  unidade,
}: {
  precos: PrecoInsumo[]
  unidade: Unidade
}) {
  if (precos.length === 0) {
    return (
      <EmptyState message="Nenhum preço anotado. Anote na próxima compra para acompanhar a variação." />
    )
  }

  const atual = precos[0]
  const maisAntigo = precos[precos.length - 1]
  const variacaoTotal =
    atual && maisAntigo && precos.length > 1
      ? variacaoPercentual(atual.preco, maisAntigo.preco)
      : null

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label={`Preço atual por ${unidade}`}
          value={atual ? formatCurrencyBRL(atual.preco) : '—'}
        />
        <StatCard label="Registros" value={String(precos.length)} />
        <StatCard
          label="Variação desde o primeiro"
          value={
            variacaoTotal == null
              ? '—'
              : `${variacaoTotal > 0 ? '+' : ''}${formatPercentBR(variacaoTotal)}%`
          }
          valueClassName={cn(
            'text-2xl font-semibold',
            variacaoTotal != null &&
              variacaoTotal > 0 &&
              'text-destructive',
            variacaoTotal != null &&
              variacaoTotal < 0 &&
              'text-emerald-600 dark:text-emerald-400'
          )}
        />
      </div>

      <div
        role="table"
        aria-label="Histórico de preço"
        className="flex flex-col gap-2"
      >
        <div
          role="row"
          className={cn(
            'hidden items-center gap-4 px-4 py-3 text-xs font-medium text-muted-foreground sm:grid',
            GRID_COLUMNS
          )}
        >
          <span role="columnheader">Vigente desde</span>
          <span role="columnheader" className="text-right">
            Preço
          </span>
          <span role="columnheader" className="text-right">
            Variação
          </span>
          <span role="columnheader">Fornecedor</span>
        </div>

        {precos.map((preco, index) => {
          const anterior = precos[index + 1]
          const variacao = anterior
            ? variacaoPercentual(preco.preco, anterior.preco)
            : null

          return (
            <div
              key={preco.id}
              role="row"
              className={cn(
                'flex flex-col gap-2 rounded-lg bg-card p-4 sm:grid sm:items-center sm:gap-4 sm:py-3',
                GRID_COLUMNS
              )}
            >
              <span
                role="cell"
                className="flex items-center justify-between gap-2 sm:block"
              >
                <MobileCellLabel>Vigente desde</MobileCellLabel>
                <span className="text-sm tabular-nums">
                  {formatDateBR(preco.dataVigencia)}
                </span>
              </span>
              <span
                role="cell"
                className="flex items-center justify-between gap-2 text-sm font-medium tabular-nums sm:block sm:text-right"
              >
                <MobileCellLabel>Preço</MobileCellLabel>
                {formatCurrencyBRL(preco.preco)}
              </span>
              <span
                role="cell"
                className={cn(
                  'flex items-center justify-between gap-2 text-sm tabular-nums sm:block sm:text-right',
                  variacao == null && 'text-muted-foreground',
                  variacao != null && variacao > 0 && 'text-destructive',
                  variacao != null &&
                    variacao < 0 &&
                    'text-emerald-600 dark:text-emerald-400'
                )}
              >
                <MobileCellLabel>Variação</MobileCellLabel>
                {variacao == null
                  ? '—'
                  : `${variacao > 0 ? '+' : ''}${formatPercentBR(variacao)}%`}
              </span>
              <span
                role="cell"
                className="flex items-center justify-between gap-2 text-sm text-muted-foreground sm:block sm:truncate"
              >
                <MobileCellLabel>Fornecedor</MobileCellLabel>
                {preco.fornecedorNome ?? '—'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
