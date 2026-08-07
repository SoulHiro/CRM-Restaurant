import { cn } from '@repo/ui/lib/utils'

import type { NivelEstoque } from '../../lib/types'

const NIVEL_CONFIG: Record<
  NivelEstoque,
  { label: string; dot: string; text: string }
> = {
  zerado: {
    label: 'Sem estoque',
    dot: 'bg-destructive',
    text: 'text-destructive',
  },
  baixo: {
    label: 'Acabando',
    dot: 'bg-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
  },
  ok: {
    label: 'Em dia',
    dot: 'bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
}

export function NivelEstoqueBadge({
  nivel,
  showDot = true,
}: {
  nivel: NivelEstoque
  showDot?: boolean
}) {
  const config = NIVEL_CONFIG[nivel]

  if (!showDot) {
    return (
      <span className={cn('text-xs font-medium', config.text)}>
        {config.label}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium">
      <span className={cn('size-1.5 shrink-0 rounded-full', config.dot)} />
      <span className={config.text}>{config.label}</span>
    </span>
  )
}
