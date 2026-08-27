import { Wallet } from 'lucide-react'

import { EmptyState } from '@repo/ui/components/empty-state'
import { MobileCellLabel } from '@repo/ui/components/mobile-cell-label'
import { cn } from '@repo/ui/lib/utils'

import { formatCurrencyBRL, formatDateBR } from '@/lib/formatters'
import {
  filtrarContas,
  ordenarPorUrgencia,
  rotuloPrazo,
  statusConta,
  type ContaFiltro,
} from '../../lib/conta-helpers'
import { SUBTIPO_LABELS } from '../../lib/dre-helpers'
import {
  filtrarContasPorJornada,
  resumoJornadaFinanceiro,
  type Jornada,
} from '../../lib/jornada-helpers'
import type { ContaPagar } from '../../lib/types'
import { ContaPagarDrawer } from '../form/conta-pagar-drawer'
import { ResumoPeriodoSidebar } from '../shared/resumo-periodo-sidebar'
import { SeletorJornada } from '../shared/seletor-jornada'
import { StatusContaBadge } from '../shared/status-conta-badge'
import { ContasFiltro } from './contas-filtro'
import { QuitarContaButton } from './quitar-conta-button'

const GRID_COLUMNS = 'sm:grid-cols-[2.2fr_1.2fr_1.2fr_1fr_8rem_3rem]'
const ROW_LAYOUT =
  'flex flex-col gap-2 p-4 sm:grid sm:items-center sm:gap-4 sm:py-3'

const CATEGORIA_LABELS = { fixa: 'Fixas', variavel: 'Variáveis' } as const

function breakdownPorCategoria(contas: ContaPagar[]) {
  const totais = { fixa: 0, variavel: 0 }
  for (const conta of contas) totais[conta.categoria] += conta.valor

  return (['fixa', 'variavel'] as const)
    .map((categoria) => ({
      label: CATEGORIA_LABELS[categoria],
      valor: totais[categoria],
    }))
    .filter((item) => item.valor > 0)
}

export function ContasPagarTab({
  todasContas,
  jornada,
  filtro,
  hoje,
}: {
  todasContas: ContaPagar[]
  jornada: Jornada
  filtro: ContaFiltro
  hoje: string
}) {
  const contasDaJornada = filtrarContasPorJornada(todasContas, jornada)
  const visiveis = ordenarPorUrgencia(
    filtrarContas(contasDaJornada, filtro, hoje)
  )
  const resumo = resumoJornadaFinanceiro(todasContas, jornada.inicio)
  const breakdown = breakdownPorCategoria(contasDaJornada)

  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <ContasFiltro filtro={filtro} />
          <div className="flex items-center gap-2">
            <SeletorJornada jornada={jornada} />
            <ContaPagarDrawer hoje={hoje} />
          </div>
        </div>

        {visiveis.length === 0 ? (
          <EmptyState
            message={
              contasDaJornada.length === 0
                ? 'Nenhuma conta nesta jornada.'
                : 'Nenhuma conta com esse filtro.'
            }
          />
        ) : (
          <div
            role="table"
            aria-label="Contas a pagar"
            className="flex flex-col gap-2"
          >
            <div
              role="row"
              className={cn(
                'hidden items-center gap-4 px-4 py-3 text-xs font-medium text-muted-foreground sm:grid',
                GRID_COLUMNS
              )}
            >
              <span role="columnheader">Conta</span>
              <span role="columnheader">Situação</span>
              <span role="columnheader">Vencimento</span>
              <span role="columnheader" className="text-right">
                Valor
              </span>
              <span role="columnheader" className="sr-only">
                Quitar
              </span>
              <span role="columnheader" className="sr-only">
                Editar
              </span>
            </div>

            {visiveis.map((conta) => {
              const status = statusConta(conta, hoje)

              return (
                <div
                  key={conta.id}
                  role="row"
                  className={cn(
                    'rounded-lg bg-card',
                    ROW_LAYOUT,
                    GRID_COLUMNS,
                    conta.status === 'pago' && 'opacity-60'
                  )}
                >
                  <span role="cell" className="flex min-w-0 flex-col">
                    <span className="truncate font-medium">
                      {conta.descricao}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {SUBTIPO_LABELS[conta.subtipo]} ·{' '}
                      {conta.categoria === 'fixa' ? 'fixa' : 'variável'}
                    </span>
                  </span>

                  <span
                    role="cell"
                    className="flex items-center justify-between gap-2 sm:block"
                  >
                    <MobileCellLabel>Situação</MobileCellLabel>
                    <StatusContaBadge status={status} />
                  </span>

                  <span
                    role="cell"
                    className="flex items-center justify-between gap-2 sm:flex-col sm:items-start sm:gap-0.5"
                  >
                    <MobileCellLabel>Vencimento</MobileCellLabel>
                    <span className="flex flex-col items-end sm:items-start">
                      <span className="text-sm tabular-nums">
                        {formatDateBR(conta.dataVencimento)}
                      </span>
                      {conta.status === 'pendente' && (
                        <span
                          className={cn(
                            'text-xs',
                            status === 'atrasado'
                              ? 'font-medium text-destructive'
                              : 'text-muted-foreground'
                          )}
                        >
                          {rotuloPrazo(conta.dataVencimento, hoje)}
                        </span>
                      )}
                    </span>
                  </span>

                  <span
                    role="cell"
                    className="flex items-center justify-between gap-2 text-sm font-medium tabular-nums sm:block sm:text-right"
                  >
                    <MobileCellLabel>Valor</MobileCellLabel>
                    {formatCurrencyBRL(conta.valor)}
                  </span>

                  <span role="cell">
                    <QuitarContaButton
                      id={conta.id}
                      tipo="pagar"
                      status={conta.status}
                      valor={conta.valor}
                      descricao={conta.descricao}
                      hoje={hoje}
                    />
                  </span>

                  <span role="cell" className="flex justify-end">
                    <ContaPagarDrawer hoje={hoje} conta={conta} />
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="lg:sticky lg:top-6">
        <ResumoPeriodoSidebar
          titulo="A pagar"
          legendaPeriodo="nesta jornada"
          icon={<Wallet className="size-4 text-muted-foreground" />}
          resumo={resumo}
          invertido
          breakdown={breakdown}
        />
      </div>
    </div>
  )
}
