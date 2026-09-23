import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card'

import type { ComandaView } from '../../lib/types'

/** Checklist de fim de expediente — comandas cujo cliente pediu nota fiscal, pra ninguém esquecer de emitir manualmente. */
export function NotasPendentesCard({ notas }: { notas: ComandaView[] }) {
  if (notas.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Notas pendentes de hoje</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1.5">
        {notas.map((comanda) => (
          <div key={comanda.id} className="flex items-center justify-between text-sm">
            <span>Comanda #{comanda.numero}</span>
            <span className="text-muted-foreground">{comanda.clienteEmail}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
