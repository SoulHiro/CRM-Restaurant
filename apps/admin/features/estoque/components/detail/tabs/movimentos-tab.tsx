import { EmptyState } from '@repo/ui/components/empty-state'
import { cn } from '@repo/ui/lib/utils'

import { formatDateBR } from '@/lib/formatters'
import type { EstoqueMovimento, Unidade } from '../../../lib/types'
import { MobileCellLabel } from '../../shared/mobile-cell-label'
import { MovimentoTipoBadge } from '../../shared/movimento-tipo-badge'
import { Quantidade } from '../../shared/quantidade'

const GRID_COLUMNS = 'sm:grid-cols-[1fr_1.4fr_1fr_1fr_1.6fr]'

export function MovimentosTab({
  movimentos,
  unidade,
}: {
  movimentos: EstoqueMovimento[]
  unidade: Unidade
}) {
  if (movimentos.length === 0) {
    return (
      <EmptyState message="Nenhuma movimentação ainda — a quantidade nunca mudou desde o cadastro." />
    )
  }

  return (
    <div
      role="table"
      aria-label="Movimentações do item"
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
        <span role="columnheader">Tipo</span>
        <span role="columnheader" className="text-right">
          Quantidade
        </span>
        <span role="columnheader" className="text-right">
          Ficou com
        </span>
        <span role="columnheader">Quem / observação</span>
      </div>

      {movimentos.map((movimento) => (
        <div
          key={movimento.id}
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
            <MobileCellLabel>Data</MobileCellLabel>
            <span className="text-sm tabular-nums">
              {formatDateBR(movimento.criadoEm)}
            </span>
          </span>

          <span
            role="cell"
            className="flex items-center justify-between gap-2 sm:block"
          >
            <MobileCellLabel>Tipo</MobileCellLabel>
            <MovimentoTipoBadge tipo={movimento.tipo} />
          </span>

          <span
            role="cell"
            className="flex items-center justify-between gap-2 sm:block sm:text-right"
          >
            <MobileCellLabel>Quantidade</MobileCellLabel>
            <Quantidade
              valor={movimento.quantidade}
              unidade={unidade}
              sinal
              className={cn(
                'font-medium',
                movimento.quantidade < 0
                  ? 'text-destructive'
                  : 'text-emerald-600 dark:text-emerald-400'
              )}
            />
          </span>

          <span
            role="cell"
            className="flex items-center justify-between gap-2 text-sm font-medium sm:block sm:text-right"
          >
            <MobileCellLabel>Ficou com</MobileCellLabel>
            <Quantidade
              valor={movimento.quantidadeResultante}
              unidade={unidade}
            />
          </span>

          <span role="cell" className="flex min-w-0 flex-col">
            <span className="truncate text-sm">
              {movimento.responsavel ?? '—'}
            </span>
            {movimento.observacao && (
              <span className="truncate text-xs text-muted-foreground">
                {movimento.observacao}
              </span>
            )}
          </span>
        </div>
      ))}
    </div>
  )
}
