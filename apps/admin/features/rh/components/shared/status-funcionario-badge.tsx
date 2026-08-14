import { cn } from '@repo/ui/lib/utils'

import type { FuncionarioStatus } from '../../lib/types'

const CONFIG: Record<
  FuncionarioStatus,
  { label: string; dot: string; text: string }
> = {
  ativo: {
    label: 'Ativo',
    dot: 'bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  desligado: {
    label: 'Desligado',
    dot: 'bg-muted-foreground',
    text: 'text-muted-foreground',
  },
}

export function StatusFuncionarioBadge({
  status,
}: {
  status: FuncionarioStatus
}) {
  const config = CONFIG[status]

  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium">
      <span className={cn('size-1.5 shrink-0 rounded-full', config.dot)} />
      <span className={config.text}>{config.label}</span>
    </span>
  )
}
