'use client'

import { useRouter } from 'next/navigation'
import { Bike } from 'lucide-react'

import { MobileCellLabel } from '@repo/ui/components/mobile-cell-label'
import { cn } from '@repo/ui/lib/utils'

import { formatCurrencyBRL, formatDateBR } from '@/lib/formatters'
import {
  MODELO_LABELS,
  TURNO_LABELS,
  tempoDeCasa,
} from '../../lib/salario-helpers'
import type { FuncionarioListItem } from '../../lib/types'
import { StatusFuncionarioBadge } from '../shared/status-funcionario-badge'

/**
 * A linha inteira é o alvo do clique, então ela toda é client — não há
 * sub-parte estática para isolar aqui (ver docs/rules/server-client-components).
 */
export function FuncionarioRow({
  funcionario,
  gridColumns,
  hoje,
}: {
  funcionario: FuncionarioListItem
  gridColumns: string
  hoje: string
}) {
  const router = useRouter()

  function abrirFicha() {
    router.push(`/funcionarios/${funcionario.id}`)
  }

  return (
    <div
      role="row"
      tabIndex={0}
      aria-label={`Abrir ficha de ${funcionario.nome}`}
      onClick={abrirFicha}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          abrirFicha()
        }
      }}
      className={cn(
        'cursor-pointer rounded-lg bg-card transition-colors hover:bg-accent/50 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none',
        'flex flex-col gap-2 p-4 sm:grid sm:items-center sm:gap-4 sm:py-3',
        gridColumns,
        funcionario.status === 'desligado' && 'opacity-60'
      )}
    >
      <span role="cell" className="flex min-w-0 flex-col">
        <span className="flex items-center gap-1.5">
          <span className="truncate font-medium">{funcionario.nome}</span>
          {funcionario.entregador && (
            <Bike
              className="size-3.5 shrink-0 text-muted-foreground"
              aria-label="Entregador"
            />
          )}
        </span>
        <span className="text-xs text-muted-foreground">
          {MODELO_LABELS[funcionario.modeloContratual]} ·{' '}
          {TURNO_LABELS[funcionario.turno]}
        </span>
      </span>

      <span
        role="cell"
        className="flex items-center justify-between gap-2 text-sm sm:block"
      >
        <MobileCellLabel>Cargo</MobileCellLabel>
        {funcionario.cargoNome}
      </span>

      <span
        role="cell"
        className="flex items-center justify-between gap-2 sm:block"
      >
        <MobileCellLabel>Situação</MobileCellLabel>
        <StatusFuncionarioBadge status={funcionario.status} />
      </span>

      <span
        role="cell"
        className="flex items-center justify-between gap-2 text-sm font-medium tabular-nums sm:block sm:text-right"
      >
        <MobileCellLabel>
          {funcionario.entregador ? 'Diária' : 'Salário'}
        </MobileCellLabel>
        {funcionario.entregador
          ? `${formatCurrencyBRL(funcionario.entregador.valorDiaria)}/dia`
          : funcionario.salarioAtual == null
            ? '—'
            : formatCurrencyBRL(funcionario.salarioAtual)}
      </span>

      <span
        role="cell"
        className="flex items-center justify-between gap-2 text-sm text-muted-foreground sm:flex-col sm:items-start sm:gap-0"
      >
        <MobileCellLabel>Na casa há</MobileCellLabel>
        <span className="flex flex-col items-end sm:items-start">
          <span>{tempoDeCasa(funcionario.dataAdmissao, hoje)}</span>
          <span className="text-xs">
            desde {formatDateBR(funcionario.dataAdmissao)}
          </span>
        </span>
      </span>
    </div>
  )
}
