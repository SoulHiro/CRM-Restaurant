import { EmptyState } from '@repo/ui/components/empty-state'
import { MobileCellLabel } from '@repo/ui/components/mobile-cell-label'
import { cn } from '@repo/ui/lib/utils'

import { formatCurrencyBRL } from '@/lib/formatters'
import { BENEFICIO_LABELS } from '../../../lib/folha-helpers'
import type { Beneficio } from '../../../lib/types'
import { BeneficioDrawer } from '../../form/beneficio-drawer'
import { AlternarBeneficioButton } from './alternar-beneficio-button'

const GRID_COLUMNS = 'sm:grid-cols-[1.6fr_1fr_1.4fr_2.5rem_6rem]'

export function BeneficiosTab({
  funcionarioId,
  beneficios,
}: {
  funcionarioId: string
  beneficios: Beneficio[]
}) {
  const naFolha = beneficios.filter((b) => b.ativo && b.recorrente)
  const totalMensal = naFolha.reduce((soma, b) => soma + b.valor, 0)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {naFolha.length === 0
            ? 'Nada entrando na folha por enquanto.'
            : `${formatCurrencyBRL(totalMensal)} por mês na folha, em ${naFolha.length} ${naFolha.length === 1 ? 'benefício' : 'benefícios'}.`}
        </p>
        <BeneficioDrawer funcionarioId={funcionarioId} />
      </div>

      {beneficios.length === 0 ? (
        <EmptyState message="Nenhum benefício cadastrado. Um benefício recorrente vira conta a pagar sozinho ao fechar a folha." />
      ) : (
        <div
          role="table"
          aria-label="Benefícios"
          className="flex flex-col gap-2"
        >
          <div
            role="row"
            className={cn(
              'hidden items-center gap-4 px-4 py-3 text-xs font-medium text-muted-foreground sm:grid',
              GRID_COLUMNS
            )}
          >
            <span role="columnheader">Benefício</span>
            <span role="columnheader" className="text-right">
              Valor
            </span>
            <span role="columnheader">Na folha</span>
            <span role="columnheader" className="sr-only">
              Editar
            </span>
            <span role="columnheader" className="sr-only">
              Ativar
            </span>
          </div>

          {beneficios.map((beneficio) => (
            <div
              key={beneficio.id}
              role="row"
              className={cn(
                'rounded-lg bg-card',
                'flex flex-col gap-2 p-4 sm:grid sm:items-center sm:gap-4 sm:py-3',
                GRID_COLUMNS,
                !beneficio.ativo && 'opacity-60'
              )}
            >
              <span role="cell" className="flex min-w-0 flex-col">
                <span className="truncate font-medium">
                  {BENEFICIO_LABELS[beneficio.tipo]}
                </span>
                {beneficio.observacao && (
                  <span className="truncate text-xs text-muted-foreground">
                    {beneficio.observacao}
                  </span>
                )}
              </span>

              <span
                role="cell"
                className="flex items-center justify-between gap-2 text-sm font-medium tabular-nums sm:block sm:text-right"
              >
                <MobileCellLabel>Valor</MobileCellLabel>
                {formatCurrencyBRL(beneficio.valor)}
              </span>

              <span
                role="cell"
                className="flex items-center justify-between gap-2 text-sm text-muted-foreground sm:block"
              >
                <MobileCellLabel>Na folha</MobileCellLabel>
                {!beneficio.ativo
                  ? 'Desativado'
                  : beneficio.recorrente
                    ? 'Todo mês'
                    : 'Avulso'}
              </span>

              <span role="cell" className="flex justify-end">
                <BeneficioDrawer
                  funcionarioId={funcionarioId}
                  beneficio={beneficio}
                />
              </span>

              <span role="cell" className="flex justify-end">
                <AlternarBeneficioButton beneficio={beneficio} />
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
