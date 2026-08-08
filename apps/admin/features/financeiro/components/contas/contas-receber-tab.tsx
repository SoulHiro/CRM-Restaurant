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
import { formatMes } from '../../lib/dre-helpers'
import type { ContaReceber } from '../../lib/types'
import { ContaReceberDrawer } from '../form/conta-receber-drawer'
import { StatusContaBadge } from '../shared/status-conta-badge'
import { ContasFiltro } from './contas-filtro'
import { QuitarContaButton } from './quitar-conta-button'

const GRID_COLUMNS = 'sm:grid-cols-[2.2fr_1.2fr_1.2fr_1fr_8rem_3rem]'
const ROW_LAYOUT =
  'flex flex-col gap-2 p-4 sm:grid sm:items-center sm:gap-4 sm:py-3'

export function ContasReceberTab({
  contas,
  filtro,
  mes,
  hoje,
}: {
  contas: ContaReceber[]
  filtro: ContaFiltro
  mes: string
  hoje: string
}) {
  const visiveis = ordenarPorUrgencia(filtrarContas(contas, filtro, hoje))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <ContasFiltro filtro={filtro} />
        <ContaReceberDrawer hoje={hoje} periodo={mes} />
      </div>

      {visiveis.length === 0 ? (
        <EmptyState
          message={
            contas.length === 0
              ? 'Nenhuma cobrança cadastrada. Registre o que as empresas ainda devem.'
              : 'Nenhuma cobrança com esse filtro.'
          }
        />
      ) : (
        <div
          role="table"
          aria-label="Contas a receber"
          className="flex flex-col gap-2"
        >
          <div
            role="row"
            className={cn(
              'hidden items-center gap-4 px-4 py-3 text-xs font-medium text-muted-foreground sm:grid',
              GRID_COLUMNS
            )}
          >
            <span role="columnheader">Empresa</span>
            <span role="columnheader">Situação</span>
            <span role="columnheader">Vencimento</span>
            <span role="columnheader" className="text-right">
              Valor
            </span>
            <span role="columnheader" className="sr-only">
              Receber
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
                    {conta.empresaNome}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Referente a {formatMes(conta.periodo)}
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
                    tipo="receber"
                    status={conta.status}
                    valor={conta.valor}
                    descricao={conta.empresaNome}
                    hoje={hoje}
                  />
                </span>

                <span role="cell" className="flex justify-end">
                  <ContaReceberDrawer
                    hoje={hoje}
                    periodo={mes}
                    conta={conta}
                  />
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
