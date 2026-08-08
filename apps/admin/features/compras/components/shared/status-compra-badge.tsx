import { cn } from '@repo/ui/lib/utils'

import type { CompraStatus } from '../../lib/types'

const STATUS_CONFIG: Record<
  CompraStatus,
  { label: string; dot: string; text: string }
> = {
  pedido_feito: {
    label: 'Pedido feito',
    dot: 'bg-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
  },
  aguardando_entrega: {
    label: 'A caminho',
    dot: 'bg-sky-500',
    text: 'text-sky-600 dark:text-sky-400',
  },
  recebido: {
    label: 'Recebido',
    dot: 'bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  cancelado: {
    label: 'Cancelado',
    dot: 'bg-muted-foreground',
    text: 'text-muted-foreground',
  },
}

export function StatusCompraBadge({
  status,
  atrasada,
}: {
  status: CompraStatus
  atrasada?: boolean
}) {
  const config = STATUS_CONFIG[status]

  if (atrasada) {
    return (
      <span className="inline-flex items-center gap-2 text-xs font-medium">
        <span className="size-1.5 shrink-0 rounded-full bg-destructive" />
        <span className="text-destructive">Entrega atrasada</span>
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
