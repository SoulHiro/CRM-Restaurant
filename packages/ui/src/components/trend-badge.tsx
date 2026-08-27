import { ArrowDown, ArrowUp } from 'lucide-react'

import { cn } from '@repo/ui/lib/utils'

/**
 * Percentual de variação + seta — usado onde um número precisa dizer "subiu"
 * ou "caiu" em relação a um período anterior. `invertido` inverte só a cor
 * (a seta continua mostrando a direção real): pra despesa, subir é ruim
 * (vermelho), não bom.
 */
export function TrendBadge({
  delta,
  invertido = false,
}: {
  delta: number | null
  invertido?: boolean
}) {
  if (delta === null) {
    return <span className="text-xs text-muted-foreground">—</span>
  }

  const isPositive = delta >= 0
  const isBom = invertido ? !isPositive : isPositive
  const Icon = isPositive ? ArrowUp : ArrowDown

  return (
    <span
      className={cn(
        'flex items-center gap-0.5 text-xs font-medium',
        isBom
          ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-red-600 dark:text-red-400'
      )}
    >
      <Icon className="size-3" />
      {Math.abs(delta)}%
    </span>
  )
}
