import { ArrowDown, ArrowUp } from 'lucide-react'

import { cn } from '@repo/ui/lib/utils'

export function TrendBadge({ delta }: { delta: number | null }) {
  if (delta === null) {
    return <span className="text-xs text-muted-foreground">—</span>
  }

  const isPositive = delta >= 0
  const Icon = isPositive ? ArrowUp : ArrowDown

  return (
    <span
      className={cn(
        'flex items-center gap-0.5 text-xs font-medium',
        isPositive
          ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-red-600 dark:text-red-400'
      )}
    >
      <Icon className="size-3" />
      {Math.abs(delta)}%
    </span>
  )
}
