import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card'
import { EmptyState } from '@repo/ui/components/empty-state'

import type { EmpresaFaturamentoMensal } from '../../../../lib/types'
import { FaturamentoBarChart } from '../../../shared/faturamento-bar-chart'

export function FaturamentoCard({
  faturamentoMensal,
}: {
  faturamentoMensal: EmpresaFaturamentoMensal[]
}) {
  return (
    <Card className="border-0">
      <CardHeader>
        <CardTitle className="text-base">Faturamento</CardTitle>
        <CardDescription>Valor faturado, mês a mês</CardDescription>
      </CardHeader>
      <CardContent>
        {faturamentoMensal.length === 0 ? (
          <EmptyState message="Sem histórico de faturamento ainda." />
        ) : (
          <FaturamentoBarChart data={faturamentoMensal} />
        )}
      </CardContent>
    </Card>
  )
}
