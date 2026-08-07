import { Button } from '@repo/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card'
import { FieldCell } from '@repo/ui/components/field-cell'
import { StatCard } from '@repo/ui/components/stat-card'

import { formatCurrencyBRL, formatDateBR } from '@/lib/formatters'
import type {
  EmpresaContrato,
  EmpresaFaturamentoMensal,
} from '../../../lib/types'
import { AtivoInativoBadge } from '../../shared/ativo-inativo-badge'
import { FaturamentoBarChart } from '../../shared/faturamento-bar-chart'

export function FaturamentoTab({
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

      {contrato && (
        <Card className="border-0">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Contrato</CardTitle>
            <AtivoInativoBadge
              active={contrato.vigente}
              activeLabel="Vigente"
              inactiveLabel="Encerrado"
            />
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <FieldCell
              label="Valor"
              value={formatCurrencyBRL(contrato.valor)}
            />
            <FieldCell
              label="Prazo de pagamento"
              value={contrato.prazoPagamento}
            />
            <FieldCell
              label="Vigência"
              value={`${formatDateBR(contrato.vigenciaInicio)} até ${formatDateBR(contrato.vigenciaFim)}`}
            />
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm">
              Ver contrato
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
