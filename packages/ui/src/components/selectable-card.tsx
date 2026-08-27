import type { LucideIcon } from 'lucide-react'
import { Check } from 'lucide-react'

import { cn } from '@repo/ui/lib/utils'

/**
 * Card de seleção reutilizado em canais de venda, turno, status,
 * classificações e escolhas rápidas fora do catálogo (ex: consumo de
 * funcionário) — ícone + nome + descrição opcional, círculo de seleção no
 * canto superior direito. Quem chama decide single/multi-select; este
 * componente só sabe "selecionado ou não".
 */
export function SelectableCard({
  icon: Icon,
  label,
  description,
  selected,
  onClick,
  className,
}: {
  icon: LucideIcon
  label: string
  description?: string
  selected: boolean
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'relative flex cursor-pointer flex-col gap-2 rounded-xl bg-card p-4 text-left shadow transition-colors hover:bg-accent/50',
        selected && 'ring-2 ring-primary',
        className
      )}
    >
      <span
        className={cn(
          'absolute right-3 top-3 flex size-5 items-center justify-center rounded-full border',
          selected
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-input bg-transparent'
        )}
      >
        {selected && <Check className="size-3.5" />}
      </span>

      <Icon className="size-5 text-muted-foreground" />

      <div className="flex flex-col gap-0.5 pr-6">
        <span className="text-sm font-medium">{label}</span>
        {description && (
          <span className="text-xs text-muted-foreground">{description}</span>
        )}
      </div>
    </button>
  )
}
