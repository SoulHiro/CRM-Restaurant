import { cn } from '@repo/ui/lib/utils'

import type { InventarioLinha } from '../../lib/types'
import { MobileCellLabel } from '@repo/ui/components/mobile-cell-label'
import { formatQuantidade, Quantidade } from '../shared/quantidade'
import { ContagemLinha } from './contagem-linha'

const GRID_COLUMNS = 'sm:grid-cols-[2.2fr_1fr_1fr_1fr]'
const ROW_LAYOUT = 'flex flex-col gap-2 p-4 sm:grid sm:items-center sm:gap-4 sm:py-3'

export function ContagemTabela({
  linhas,
  inventarioId,
  editavel,
}: {
  linhas: InventarioLinha[]
  inventarioId: string
  editavel: boolean
}) {
  return (
    <div
      role="table"
      aria-label="Linhas da contagem"
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
          Sistema
        </span>
        <span role="columnheader">Contado</span>
        <span role="columnheader" className="text-right">
          Diferença
        </span>
      </div>

      {linhas.map((linha) =>
        editavel ? (
          <ContagemLinha
            key={linha.id}
            linha={linha}
            inventarioId={inventarioId}
            className={cn(ROW_LAYOUT, GRID_COLUMNS)}
          />
        ) : (
          <div
            key={linha.id}
            role="row"
            className={cn('rounded-lg bg-card', ROW_LAYOUT, GRID_COLUMNS)}
          >
            <span role="cell" className="min-w-0">
              <span className="block truncate font-medium">
                {linha.itemNome}
              </span>
            </span>
            <span
              role="cell"
              className="flex items-center justify-between gap-2 text-sm text-muted-foreground sm:block sm:text-right"
            >
              <MobileCellLabel>Sistema</MobileCellLabel>
              <Quantidade
                valor={linha.quantidadeSistema}
                unidade={linha.unidade}
                className="tabular-nums"
              />
            </span>
            <span
              role="cell"
              className="flex items-center justify-between gap-2 text-sm tabular-nums sm:block"
            >
              <MobileCellLabel>Contado</MobileCellLabel>
              {linha.quantidadeContada == null
                ? '—'
                : `${formatQuantidade(linha.quantidadeContada)} ${linha.unidade}`}
            </span>
            <span
              role="cell"
              className={cn(
                'flex items-center justify-between gap-2 text-sm font-medium tabular-nums sm:block sm:text-right',
                linha.diferenca == null && 'text-muted-foreground',
                linha.diferenca != null &&
                  linha.diferenca < 0 &&
                  'text-destructive',
                linha.diferenca != null &&
                  linha.diferenca > 0 &&
                  'text-emerald-600 dark:text-emerald-400',
                linha.diferenca === 0 && 'text-muted-foreground'
              )}
            >
              <MobileCellLabel>Diferença</MobileCellLabel>
              {linha.diferenca == null
                ? 'Não contado'
                : linha.diferenca === 0
                  ? 'Bateu'
                  : `${linha.diferenca > 0 ? '+' : ''}${formatQuantidade(linha.diferenca)}`}
            </span>
          </div>
        )
      )}
    </div>
  )
}
