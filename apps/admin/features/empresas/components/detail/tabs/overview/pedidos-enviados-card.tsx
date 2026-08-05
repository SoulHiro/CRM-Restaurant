import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card'
import { EmptyState } from '@repo/ui/components/empty-state'

import type { getEnviosPorDia } from '../../../../lib/overview-helpers'
import { PedidosEnviadosChart } from './pedidos-enviados-chart'

export function PedidosEnviadosCard({
  enviosPorDia,
}: {
  enviosPorDia: ReturnType<typeof getEnviosPorDia>
}) {
  return (
    <Card className="border-0">
      <CardHeader>
        <CardTitle className="text-base">Pedidos enviados</CardTitle>
        <CardDescription>
          Envios para a Consumer ao longo do tempo
        </CardDescription>
      </CardHeader>
      <CardContent>
        {enviosPorDia.length === 0 ? (
          <EmptyState message="Sem pedidos enviados ainda." />
        ) : (
          <PedidosEnviadosChart data={enviosPorDia} />
        )}
      </CardContent>
    </Card>
  )
}
