import { Badge } from '@repo/ui/components/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card'
import { EmptyState } from '@repo/ui/components/empty-state'

import { formatDateBR } from '@/lib/formatters'
import type { EmpresaEnvio } from '../../../../lib/types'

export function EnviosComErroCard({ envios }: { envios: EmpresaEnvio[] }) {
  return (
    <Card className="border-0">
      <CardHeader>
        <CardTitle className="text-base">Envios com erro</CardTitle>
        <CardDescription>
          Pedidos que falharam ao enviar para a Consumer
        </CardDescription>
      </CardHeader>
      <CardContent>
        {envios.length === 0 ? (
          <EmptyState message="Nenhum envio com erro." />
        ) : (
          <div className="flex flex-col gap-3">
            {envios.map((envio) => (
              <div
                key={envio.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="font-medium">{formatDateBR(envio.data)}</span>
                <Badge variant="destructive">Erro</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
