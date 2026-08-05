import { cn } from '@repo/ui/lib/utils'

import type { EmpresaListStatus } from '../../lib/types'

const STATUS_CONFIG: Record<
  EmpresaListStatus,
  { label: string; dot: string; text: string }
> = {
  aguardando: {
    label: 'Aguardando respostas',
    dot: 'bg-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
  },
  finalizado: {
    label: 'Finalizado',
    dot: 'bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
}

export function ListStatusBadge({
  status,
  showDot = true,
}: {
  status: EmpresaListStatus
  showDot?: boolean
}) {
  const config = STATUS_CONFIG[status]

  if (!showDot) {
    return (
      <span className={cn('text-xs font-medium', config.text)}>
        {config.label}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-2 text-sm font-medium">
      <span className={cn('size-1.5 shrink-0 rounded-full', config.dot)} />
      <span className={config.text}>{config.label}</span>
    </span>
  )
}
