import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card'
import { EmptyState } from '@repo/ui/components/empty-state'

import type { EnviosHeatmap } from '../../../../lib/overview-helpers'
import { PedidosEnviadosHeatmap } from './pedidos-enviados-heatmap'

export function PedidosEnviadosCard({
  heatmap,
}: {
  heatmap: EnviosHeatmap
}) {
  const temEnvios = heatmap.semanas.some((semana) =>
    semana.dias.some((dia) => dia.total > 0)
  )

  return (
    <Card className="col-span-2 flex h-full flex-col overflow-hidden border-0">
      <CardHeader>
        <CardTitle className="text-base">Pedidos enviados</CardTitle>
        <CardDescription>
          Envios para a Consumer ao longo do tempo
        </CardDescription>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 items-center">
        {!temEnvios ? (
          <EmptyState message="Sem pedidos enviados ainda." />
        ) : (
          <PedidosEnviadosHeatmap heatmap={heatmap} />
        )}
      </CardContent>
    </Card>
  )
}
