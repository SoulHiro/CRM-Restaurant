import { EmptyState } from '@repo/ui/components/empty-state'
import { MobileCellLabel } from '@repo/ui/components/mobile-cell-label'
import { cn } from '@repo/ui/lib/utils'

import { formatDateBR } from '@/lib/formatters'
import { agruparAusenciasPorTipo, AUSENCIA_LABELS } from '../../../lib/ausencia-helpers'
import type { Ausencia } from '../../../lib/types'
import { AusenciaDrawer } from '../../form/ausencia-drawer'
import { TipoAusenciaBadge } from '../../shared/tipo-ausencia-badge'
import { ExcluirAusenciaButton } from './excluir-ausencia-button'

const GRID_COLUMNS = 'sm:grid-cols-[1.3fr_1.4fr_1fr_1.4fr_2.5rem_2.5rem]'

export function AusenciasTab({
  funcionarioId,
  funcionarioNome,
  ausencias,
  hoje,
}: {
  funcionarioId: string
  funcionarioNome: string
  ausencias: Ausencia[]
  hoje: string
}) {
  const resumo = agruparAusenciasPorTipo(ausencias)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {resumo.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            {resumo
              .map(
                (grupo) =>
                  `${grupo.quantidade} ${AUSENCIA_LABELS[grupo.tipo].toLowerCase()}`
              )
              .join(' · ')}
          </p>
        ) : (
          <span />
        )}
        <AusenciaDrawer
          funcionarioId={funcionarioId}
          funcionarioNome={funcionarioNome}
          hoje={hoje}
        />
      </div>

      {ausencias.length === 0 ? (
        <EmptyState message="Nenhuma ausência registrada. Em quem recebe por diária, os dias daqui saem da folha do mês." />
      ) : (
        <div role="table" aria-label="Ausências" className="flex flex-col gap-2">
          <div
            role="row"
            className={cn(
              'hidden items-center gap-4 px-4 py-3 text-xs font-medium text-muted-foreground sm:grid',
              GRID_COLUMNS
            )}
          >
            <span role="columnheader">Tipo</span>
            <span role="columnheader">Período</span>
            <span role="columnheader" className="text-right">
              Dias
            </span>
            <span role="columnheader">Registrado por</span>
            <span role="columnheader" className="sr-only">
              Editar
            </span>
            <span role="columnheader" className="sr-only">
              Excluir
            </span>
          </div>

          {ausencias.map((ausencia) => (
            <div
              key={ausencia.id}
              role="row"
              className={cn(
                'rounded-lg bg-card',
                'flex flex-col gap-2 p-4 sm:grid sm:items-center sm:gap-4 sm:py-3',
                GRID_COLUMNS
              )}
            >
              <span
                role="cell"
                className="flex items-center justify-between gap-2 sm:block"
              >
                <MobileCellLabel>Tipo</MobileCellLabel>
                <TipoAusenciaBadge tipo={ausencia.tipo} />
              </span>

              <span
                role="cell"
                className="flex items-center justify-between gap-2 text-sm tabular-nums sm:block"
              >
                <MobileCellLabel>Período</MobileCellLabel>
                {ausencia.dataInicio === ausencia.dataFim
                  ? formatDateBR(ausencia.dataInicio)
                  : `${formatDateBR(ausencia.dataInicio)} a ${formatDateBR(ausencia.dataFim)}`}
              </span>

              <span
                role="cell"
                className="flex items-center justify-between gap-2 text-sm tabular-nums sm:block sm:text-right"
              >
                <MobileCellLabel>Dias</MobileCellLabel>
                {ausencia.dias}
              </span>

              <span
                role="cell"
                className="flex items-center justify-between gap-2 text-sm text-muted-foreground sm:flex-col sm:items-start sm:gap-0"
              >
                <MobileCellLabel>Registrado por</MobileCellLabel>
                <span className="flex flex-col items-end sm:items-start">
                  <span>{ausencia.responsavel ?? '—'}</span>
                  {ausencia.observacao && (
                    <span className="text-xs">{ausencia.observacao}</span>
                  )}
                </span>
              </span>

              <span role="cell" className="flex justify-end">
                <AusenciaDrawer
                  funcionarioId={funcionarioId}
                  funcionarioNome={funcionarioNome}
                  ausencia={ausencia}
                  hoje={hoje}
                />
              </span>

              <span role="cell" className="flex justify-end">
                <ExcluirAusenciaButton ausencia={ausencia} />
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
