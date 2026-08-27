import { Landmark } from 'lucide-react'

import { EmptyState } from '@repo/ui/components/empty-state'
import { PersonAvatar } from '@repo/ui/components/person-avatar'

import { formatCurrencyBRL } from '@/lib/formatters'
import type { FaturamentoEmpresaPeriodo } from '@/features/empresas/lib/types'
import { resumoQuinzenaFinanceiro, type Quinzena } from '../../lib/quinzena-helpers'
import { ResumoPeriodoSidebar } from '../shared/resumo-periodo-sidebar'
import { SeletorQuinzena } from '../shared/seletor-quinzena'

const GRID_COLUMNS = 'sm:grid-cols-[1fr_10rem]'

export function ContasReceberTab({
  quinzena,
  faturamentoPorEmpresa,
  faturamentoDiario,
}: {
  quinzena: Quinzena
  faturamentoPorEmpresa: FaturamentoEmpresaPeriodo[]
  faturamentoDiario: { dataVencimento: string; valor: number }[]
}) {
  const resumo = resumoQuinzenaFinanceiro(faturamentoDiario, quinzena)
  const breakdown = faturamentoPorEmpresa.map((item) => ({
    label: item.empresaNome,
    valor: item.valor,
  }))

  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Apurado pelo fechamento diário de cada empresa — vai somando até
            fechar a quinzena.
          </p>
          <SeletorQuinzena quinzena={quinzena} />
        </div>

        {faturamentoPorEmpresa.length === 0 ? (
          <EmptyState message="Nenhum dia fechado nesta quinzena ainda." />
        ) : (
          <div
            role="table"
            aria-label="Faturamento por empresa"
            className="flex flex-col gap-2"
          >
            <div
              role="row"
              className={`hidden items-center gap-4 px-4 py-3 text-xs font-medium text-muted-foreground sm:grid ${GRID_COLUMNS}`}
            >
              <span role="columnheader">Empresa</span>
              <span role="columnheader" className="text-right">
                Apurado nesta quinzena
              </span>
            </div>

            {faturamentoPorEmpresa.map((item) => (
              <div
                key={item.empresaId}
                role="row"
                className={`flex items-center gap-3 rounded-lg bg-card p-3 sm:grid sm:gap-4 ${GRID_COLUMNS}`}
              >
                <span role="cell" className="flex min-w-0 items-center gap-2.5">
                  <PersonAvatar name={item.empresaNome} className="size-8 shrink-0" />
                  <span className="truncate font-medium">{item.empresaNome}</span>
                </span>
                <span
                  role="cell"
                  className="text-right text-sm font-semibold tabular-nums"
                >
                  {formatCurrencyBRL(item.valor)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="lg:sticky lg:top-6">
        <ResumoPeriodoSidebar
          titulo="A receber"
          legendaPeriodo="nesta quinzena"
          icon={<Landmark className="size-4 text-muted-foreground" />}
          resumo={resumo}
          breakdown={breakdown}
          breakdownLabel="Por empresa nesta quinzena"
        />
      </div>
    </div>
  )
}
