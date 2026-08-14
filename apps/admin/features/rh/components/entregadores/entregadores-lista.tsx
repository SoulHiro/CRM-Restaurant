import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

import { EmptyState } from '@repo/ui/components/empty-state'
import { MobileCellLabel } from '@repo/ui/components/mobile-cell-label'
import { cn } from '@repo/ui/lib/utils'

import { formatCurrencyBRL } from '@/lib/formatters'
import { DIAS_DA_SEMANA } from '../../lib/ausencia-helpers'
import { MODELO_LABELS, tempoDeCasa } from '../../lib/salario-helpers'
import type { FuncionarioListItem } from '../../lib/types'
import { StatusFuncionarioBadge } from '../shared/status-funcionario-badge'

const GRID_COLUMNS = 'sm:grid-cols-[2fr_1.2fr_1fr_1fr_1fr_2.5rem]'

export function EntregadoresLista({
  entregadores,
  hoje,
}: {
  entregadores: FuncionarioListItem[]
  hoje: string
}) {
  if (entregadores.length === 0) {
    return (
      <EmptyState message="Nenhum entregador cadastrado. Entregador é um funcionário que recebe por diária — marque isso ao admitir, ou pelo botão “Tornar entregador” na ficha dele." />
    )
  }

  return (
    <div role="table" aria-label="Entregadores" className="flex flex-col gap-2">
      <div
        role="row"
        className={cn(
          'hidden items-center gap-4 px-4 py-3 text-xs font-medium text-muted-foreground sm:grid',
          GRID_COLUMNS
        )}
      >
        <span role="columnheader">Nome</span>
        <span role="columnheader">Situação</span>
        <span role="columnheader" className="text-right">
          Diária
        </span>
        <span role="columnheader" className="text-right">
          Taxa
        </span>
        <span role="columnheader">Folga</span>
        <span role="columnheader" className="sr-only">
          Abrir
        </span>
      </div>

      {entregadores.map((entregador) => (
        <div
          key={entregador.id}
          role="row"
          className={cn(
            'rounded-lg bg-card',
            'flex flex-col gap-2 p-4 sm:grid sm:items-center sm:gap-4 sm:py-3',
            GRID_COLUMNS,
            entregador.status === 'desligado' && 'opacity-60'
          )}
        >
          <span role="cell" className="flex min-w-0 flex-col">
            <span className="truncate font-medium">{entregador.nome}</span>
            <span className="text-xs text-muted-foreground">
              {MODELO_LABELS[entregador.modeloContratual]} · há{' '}
              {tempoDeCasa(entregador.dataAdmissao, hoje)}
            </span>
          </span>

          <span
            role="cell"
            className="flex items-center justify-between gap-2 sm:block"
          >
            <MobileCellLabel>Situação</MobileCellLabel>
            <StatusFuncionarioBadge status={entregador.status} />
          </span>

          <span
            role="cell"
            className="flex items-center justify-between gap-2 text-sm font-medium tabular-nums sm:block sm:text-right"
          >
            <MobileCellLabel>Diária</MobileCellLabel>
            {formatCurrencyBRL(entregador.entregador?.valorDiaria ?? 0)}
          </span>

          <span
            role="cell"
            className="flex items-center justify-between gap-2 text-sm text-muted-foreground tabular-nums sm:block sm:text-right"
          >
            <MobileCellLabel>Taxa</MobileCellLabel>
            {entregador.entregador?.taxaEntregaPercentual == null
              ? '—'
              : `${entregador.entregador.taxaEntregaPercentual}%`}
          </span>

          <span
            role="cell"
            className="flex items-center justify-between gap-2 text-sm text-muted-foreground sm:block"
          >
            <MobileCellLabel>Folga</MobileCellLabel>
            {entregador.entregador?.folgaSemanal == null
              ? 'só rodízio'
              : DIAS_DA_SEMANA[entregador.entregador.folgaSemanal]}
          </span>

          <span role="cell" className="flex justify-end">
            <Link
              href={`/funcionarios/${entregador.id}`}
              className="flex h-9 w-full items-center justify-center gap-2 rounded-md text-sm text-muted-foreground transition-colors hover:bg-muted focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none sm:w-9"
            >
              <span className="sm:hidden">Abrir ficha</span>
              <ChevronRight className="size-4" />
            </Link>
          </span>
        </div>
      ))}
    </div>
  )
}
