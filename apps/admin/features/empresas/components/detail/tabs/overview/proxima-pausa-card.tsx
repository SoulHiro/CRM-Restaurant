import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card'
import { EmptyState } from '@repo/ui/components/empty-state'

import { formatDateBR } from '@/lib/formatters'
import type { EmpresaPausa } from '../../../../lib/types'

export function ProximaPausaCard({
  pausa,
}: {
  pausa: EmpresaPausa | undefined
}) {
  return (
    <Card className="border-0">
      <CardHeader>
        <CardTitle className="text-base">Próxima pausa</CardTitle>
        <CardDescription>Próximo dia sem pedido agendado</CardDescription>
      </CardHeader>
      <CardContent>
        {!pausa ? (
          <EmptyState message="Nenhuma pausa agendada." />
        ) : (
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Data</span>
              <span className="font-medium">{formatDateBR(pausa.data)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Motivo</span>
              <span className="font-medium">{pausa.motivo ?? '—'}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
