import { cn } from '@repo/ui/lib/utils'

import { AUSENCIA_LABELS } from '../../lib/ausencia-helpers'
import type { AusenciaTipo } from '../../lib/types'

/**
 * Falta injustificada é a única que pesa — as outras são combinadas e não
 * deveriam gritar na tela.
 */
const CONFIG: Record<AusenciaTipo, { dot: string; text: string }> = {
  atestado_medico: {
    dot: 'bg-sky-500',
    text: 'text-sky-600 dark:text-sky-400',
  },
  folga: { dot: 'bg-muted-foreground', text: 'text-muted-foreground' },
  ferias: {
    dot: 'bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  falta_justificada: {
    dot: 'bg-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
  },
  falta_injustificada: { dot: 'bg-destructive', text: 'text-destructive' },
}

export function TipoAusenciaBadge({ tipo }: { tipo: AusenciaTipo }) {
  const config = CONFIG[tipo]

  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium">
      <span className={cn('size-1.5 shrink-0 rounded-full', config.dot)} />
      <span className={config.text}>{AUSENCIA_LABELS[tipo]}</span>
    </span>
  )
}
