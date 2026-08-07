import { cn } from '@repo/ui/lib/utils'

import { formatDateBR } from '@/lib/formatters'
import { DIAS_ALERTA_VENCIMENTO, diasAteVencer } from '../../lib/estoque-helpers'

function rotuloPrazo(dias: number): string {
  if (dias < 0) return `Venceu há ${Math.abs(dias)}d`
  if (dias === 0) return 'Vence hoje'
  if (dias === 1) return 'Vence amanhã'
  return `Faltam ${dias}d`
}

export function ValidadeBadge({
  validade,
  hoje,
}: {
  validade: string | null
  hoje: string
}) {
  if (!validade) {
    return <span className="text-sm text-muted-foreground">—</span>
  }

  const dias = diasAteVencer(validade, hoje)
  const urgente = dias < 0
  const proximo = !urgente && dias <= DIAS_ALERTA_VENCIMENTO

  return (
    <span className="flex flex-col gap-0.5">
      <span className="text-sm tabular-nums">{formatDateBR(validade)}</span>
      <span
        className={cn(
          'text-xs',
          urgente && 'font-medium text-destructive',
          proximo && 'font-medium text-amber-600 dark:text-amber-400',
          !urgente && !proximo && 'text-muted-foreground'
        )}
      >
        {rotuloPrazo(dias)}
      </span>
    </span>
  )
}
