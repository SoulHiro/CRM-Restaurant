import { RefreshCw } from 'lucide-react'

import { Button } from '@repo/ui/components/button'
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
    <Card className="col-span-2 flex h-full flex-col overflow-hidden border-0">
      <CardHeader>
        <CardTitle className="text-base">Envios com erro</CardTitle>
        <CardDescription>
          Pedidos que falharam ao enviar para a Consumer
        </CardDescription>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-y-auto">
        {envios.length === 0 ? (
          <EmptyState message="Nenhum envio com erro." />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {envios.map((envio) => (
              <div
                key={envio.id}
                className="flex flex-col gap-2 rounded-lg bg-muted p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">
                    {formatDateBR(envio.data)} às {envio.horario}
                  </span>
                  <Button type="button" variant="outline" size="sm">
                    <RefreshCw className="size-3.5" />
                    Reenviar
                  </Button>
                </div>
                <span className="text-xs text-muted-foreground">
                  Responsável: {envio.responsavel}
                </span>
                {envio.motivoErro ? (
                  <span className="text-xs text-destructive">
                    {envio.motivoErro}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
