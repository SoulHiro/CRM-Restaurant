import { cn } from '@repo/ui/lib/utils'

import type { StatusConta } from '../../lib/types'

const STATUS_CONFIG: Record<
  StatusConta,
  { label: string; dot: string; text: string }
> = {
  atrasado: {
    label: 'Atrasada',
    dot: 'bg-destructive',
    text: 'text-destructive',
  },
  pendente: {
    label: 'Em aberto',
    dot: 'bg-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
  },
  pago: {
    label: 'Quitada',
    dot: 'bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
}

export function StatusContaBadge({ status }: { status: StatusConta }) {
  const config = STATUS_CONFIG[status]

  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium">
      <span className={cn('size-1.5 shrink-0 rounded-full', config.dot)} />
      <span className={config.text}>{config.label}</span>
    </span>
  )
}
