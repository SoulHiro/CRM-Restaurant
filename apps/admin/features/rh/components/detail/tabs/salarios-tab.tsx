import { EmptyState } from '@repo/ui/components/empty-state'
import { MobileCellLabel } from '@repo/ui/components/mobile-cell-label'
import { cn } from '@repo/ui/lib/utils'

import { formatCurrencyBRL, formatDateBR } from '@/lib/formatters'
import { MOTIVO_SALARIO_LABELS } from '../../../lib/salario-helpers'
import type { RegistroSalario } from '../../../lib/types'

const GRID_COLUMNS = 'sm:grid-cols-[1.2fr_1.2fr_1fr_1.4fr]'

/**
 * A lista já chega ordenada da mais recente para a mais antiga: a primeira
 * linha é a vigente hoje, e a variação mostra o que cada reajuste mudou.
 */
export function SalariosTab({ salarios }: { salarios: RegistroSalario[] }) {
  if (salarios.length === 0) {
    return (
      <EmptyState message="Nenhum salário registrado. Quem recebe por diária não tem histórico de salário — o valor fica na aba Dados." />
    )
  }

  return (
    <div
      role="table"
      aria-label="Histórico de salário"
      className="flex flex-col gap-2"
    >
      <div
        role="row"
        className={cn(
          'hidden items-center gap-4 px-4 py-3 text-xs font-medium text-muted-foreground sm:grid',
          GRID_COLUMNS
        )}
      >
        <span role="columnheader">Vale desde</span>
        <span role="columnheader" className="text-right">
          Valor
        </span>
        <span role="columnheader">Motivo</span>
        <span role="columnheader">Registrado por</span>
      </div>

      {salarios.map((registro, indice) => {
        const anterior = salarios[indice + 1]
        const variacao = anterior ? registro.valor - anterior.valor : null

        return (
          <div
            key={registro.id}
            role="row"
            className={cn(
              'rounded-lg bg-card',
              'flex flex-col gap-2 p-4 sm:grid sm:items-center sm:gap-4 sm:py-3',
              GRID_COLUMNS,
              indice > 0 && 'opacity-70'
            )}
          >
            <span
              role="cell"
              className="flex items-center justify-between gap-2 sm:block"
            >
              <MobileCellLabel>Vale desde</MobileCellLabel>
              <span className="flex flex-col items-end sm:items-start">
                <span className="text-sm font-medium tabular-nums">
                  {formatDateBR(registro.vigenteDesde)}
                </span>
                {indice === 0 && (
                  <span className="text-xs text-muted-foreground">vigente</span>
                )}
              </span>
            </span>

            <span
              role="cell"
              className="flex items-center justify-between gap-2 sm:block sm:text-right"
            >
              <MobileCellLabel>Valor</MobileCellLabel>
              <span className="flex flex-col items-end">
                <span className="text-sm font-medium tabular-nums">
                  {formatCurrencyBRL(registro.valor)}
                </span>
                {variacao != null && variacao !== 0 && (
                  <span
                    className={cn(
                      'text-xs font-medium tabular-nums',
                      variacao > 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-destructive'
                    )}
                  >
                    {variacao > 0 ? '+' : '−'}
                    {formatCurrencyBRL(Math.abs(variacao))}
                  </span>
                )}
              </span>
            </span>

            <span
              role="cell"
              className="flex items-center justify-between gap-2 text-sm text-muted-foreground sm:block"
            >
              <MobileCellLabel>Motivo</MobileCellLabel>
              {MOTIVO_SALARIO_LABELS[registro.motivo]}
            </span>

            <span
              role="cell"
              className="flex items-center justify-between gap-2 text-sm text-muted-foreground sm:flex-col sm:items-start sm:gap-0"
            >
              <MobileCellLabel>Registrado por</MobileCellLabel>
              <span className="flex flex-col items-end sm:items-start">
                <span>{registro.responsavel ?? '—'}</span>
                {registro.observacao && (
                  <span className="text-xs">{registro.observacao}</span>
                )}
              </span>
            </span>
          </div>
        )
      })}
    </div>
  )
}
