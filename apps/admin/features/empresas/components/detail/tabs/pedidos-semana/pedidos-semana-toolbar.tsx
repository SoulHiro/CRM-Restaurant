'use client'

import { Printer } from 'lucide-react'

import { Button } from '@repo/ui/components/button'

export function PedidosSemanaToolbar({
  diaSemanaLabel,
  total,
  restantes,
  jaImprimiuAlgum,
  onPrintAll,
}: {
  diaSemanaLabel: string | null
  total: number
  restantes: number
  jaImprimiuAlgum: boolean
  onPrintAll: () => void
}) {
  const tudoImpresso = restantes === 0

  const label = !jaImprimiuAlgum
    ? 'Imprimir Todos'
    : tudoImpresso
      ? 'Tudo impresso'
      : `Imprimir (${restantes}) Restantes`

  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm text-muted-foreground">
        {total} pedido{total > 1 ? 's' : ''}
        {diaSemanaLabel ? ` em ${diaSemanaLabel}` : ''}
      </p>
      <Button onClick={onPrintAll} disabled={tudoImpresso || total === 0}>
        <Printer className="size-4" />
        {label}
      </Button>
    </div>
  )
}
