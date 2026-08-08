import { Star } from 'lucide-react'

import { cn } from '@repo/ui/lib/utils'

import { formatPercentBR } from '@/lib/formatters'

/**
 * Fornecedor sem avaliação mostra o vazio explícito — zero estrelas seria lido
 * como "nota péssima", que é a informação errada.
 */
export function NotaAvaliacao({
  nota,
  className,
}: {
  nota: number | null
  className?: string
}) {
  if (nota == null) {
    return (
      <span className={cn('text-xs text-muted-foreground', className)}>
        Sem avaliação
      </span>
    )
  }

  return (
    <span
      className={cn('inline-flex items-center gap-1.5', className)}
      aria-label={`Nota ${formatPercentBR(nota)} de 5`}
    >
      <span className="flex" aria-hidden>
        {[1, 2, 3, 4, 5].map((posicao) => (
          <Star
            key={posicao}
            className={cn(
              'size-3.5',
              posicao <= Math.round(nota)
                ? 'fill-primary text-primary'
                : 'text-muted-foreground/40'
            )}
          />
        ))}
      </span>
      <span className="text-xs font-medium tabular-nums">
        {formatPercentBR(nota)}
      </span>
    </span>
  )
}
