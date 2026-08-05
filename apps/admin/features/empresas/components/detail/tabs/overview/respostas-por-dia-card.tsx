import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card'
import { EmptyState } from '@repo/ui/components/empty-state'

import type { EmpresaRespostaSemanal } from '../../../../lib/types'
import { LegendDot } from '../../../shared/legend-dot'
import { RespostasPorDiaChart } from './respostas-por-dia-chart'

export function RespostasPorDiaCard({
  respostasSemanais,
}: {
  respostasSemanais: EmpresaRespostaSemanal[]
}) {
  return (
    <Card className="border-0">
      <CardHeader>
        <CardTitle className="text-base">Respostas por dia</CardTitle>
        <CardDescription className="w-full">
          Funcionários que responderam o cardápio, domingo a sábado
        </CardDescription>
      </CardHeader>
      <CardContent>
        {respostasSemanais.length === 0 ? (
          <EmptyState message="Sem dados de resposta ainda." />
        ) : (
          <div className="rounded-lg bg-muted p-4">
            <div className="mb-2 flex items-center justify-end gap-3">
              <LegendDot color="var(--sidebar)" label="Responderam" />
              <LegendDot color="var(--primary)" label="Pendentes" />
            </div>
            <RespostasPorDiaChart data={respostasSemanais} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
