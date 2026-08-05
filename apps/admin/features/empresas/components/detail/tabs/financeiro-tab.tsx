import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card'
import { StatCard } from '@repo/ui/components/stat-card'

import { formatCurrencyBRL } from '@/lib/formatters'
import type {
  EmpresaContrato,
  EmpresaFaturamentoMensal,
} from '../../../lib/types'
import { FaturamentoBarChart } from '../../shared/faturamento-bar-chart'

export function FinanceiroTab({
  faturamentoMensal,
  contrato,
}: {
  faturamentoMensal: EmpresaFaturamentoMensal[]
  contrato?: EmpresaContrato
}) {
  const totalPeriodo = faturamentoMensal.reduce(
    (soma, item) => soma + item.valor,
    0
  )
  const ticketMedio =
    faturamentoMensal.length > 0 ? totalPeriodo / faturamentoMensal.length : 0

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-3 gap-6">
        <StatCard
          label="Faturado no período"
          value={formatCurrencyBRL(totalPeriodo)}
        />
        <StatCard label="Média mensal" value={formatCurrencyBRL(ticketMedio)} />
        <StatCard
          label="Valor do contrato atual"
          value={contrato ? formatCurrencyBRL(contrato.valor) : '—'}
        />
      </div>

      <Card className="border-0">
        <CardHeader>
          <CardTitle className="text-base">Faturamento mensal</CardTitle>
          <CardDescription>
            Valor faturado com essa empresa, mês a mês. Não representa lucro —
            não há dados de custo associados no sistema ainda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {faturamentoMensal.length === 0 ? (
            <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
              Sem histórico de faturamento ainda.
            </div>
          ) : (
            <FaturamentoBarChart
              data={faturamentoMensal}
              className="h-[280px] w-full"
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
