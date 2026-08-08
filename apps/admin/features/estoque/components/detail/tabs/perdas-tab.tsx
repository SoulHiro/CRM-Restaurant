import { EmptyState } from '@repo/ui/components/empty-state'
import { StatCard } from '@repo/ui/components/stat-card'
import { cn } from '@repo/ui/lib/utils'

import { formatDateBR } from '@/lib/formatters'
import type { PerdaEstoque, PerdaMotivo, Unidade } from '../../../lib/types'
import { MobileCellLabel } from '@repo/ui/components/mobile-cell-label'
import { formatQuantidade, Quantidade } from '../../shared/quantidade'

const MOTIVO_LABELS: Record<PerdaMotivo, string> = {
  vencido: 'Venceu',
  quebra: 'Quebrou / estragou',
  erro_preparo: 'Erro no preparo',
  outro: 'Outro',
}

const GRID_COLUMNS = 'sm:grid-cols-[1fr_1.4fr_1fr_1.4fr_1.6fr]'

export function PerdasTab({
  perdas,
  unidade,
}: {
  perdas: PerdaEstoque[]
  unidade: Unidade
}) {
  if (perdas.length === 0) {
    return <EmptyState message="Nenhuma perda registrada para esse item." />
  }

  const total = perdas.reduce((soma, perda) => soma + perda.quantidade, 0)
  const motivoMaisComum = Object.entries(
    perdas.reduce<Record<string, number>>((contagem, perda) => {
      contagem[perda.motivo] = (contagem[perda.motivo] ?? 0) + perda.quantidade
      return contagem
    }, {})
  ).sort((a, b) => b[1] - a[1])[0]

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total perdido"
          value={`${formatQuantidade(total)} ${unidade}`}
        />
        <StatCard label="Registros" value={String(perdas.length)} />
        <StatCard
          label="Maior causa"
          value={
            motivoMaisComum
              ? MOTIVO_LABELS[motivoMaisComum[0] as PerdaMotivo]
              : '—'
          }
          valueClassName="text-xl font-semibold"
        />
      </div>

      <div
        role="table"
        aria-label="Perdas do item"
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
          <span role="columnheader">Motivo</span>
          <span role="columnheader" className="text-right">
            Quantidade
          </span>
          <span role="columnheader">Quem registrou</span>
          <span role="columnheader">Observação</span>
        </div>

        {perdas.map((perda) => (
          <div
            key={perda.id}
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
                {formatDateBR(perda.data)}
              </span>
            </span>
            <span
              role="cell"
              className="flex items-center justify-between gap-2 sm:block"
            >
              <MobileCellLabel>Motivo</MobileCellLabel>
              <span className="text-sm">{MOTIVO_LABELS[perda.motivo]}</span>
            </span>
            <span
              role="cell"
              className="flex items-center justify-between gap-2 sm:block sm:text-right"
            >
              <MobileCellLabel>Quantidade</MobileCellLabel>
              <Quantidade
                valor={perda.quantidade}
                unidade={unidade}
                className="font-medium text-destructive"
              />
            </span>
            <span
              role="cell"
              className="flex items-center justify-between gap-2 text-sm sm:block"
            >
              <MobileCellLabel>Quem registrou</MobileCellLabel>
              <span className="truncate">{perda.responsavel}</span>
            </span>
            <span
              role="cell"
              className="text-sm text-muted-foreground sm:truncate"
            >
              {perda.observacao ?? '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
