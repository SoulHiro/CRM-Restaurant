'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Gem, GripVertical, Pin, Star, X } from 'lucide-react'

import { cn } from '@repo/ui/lib/utils'

import type { CardapioDiaPrato } from '../lib/types'

/** Uma alternativa dentro de um dia — arrastável só entre itens do mesmo dia (reordena `ordem`). */
export function CardapioItemRow({
  prato,
  diaData,
  onPromoverDestaque,
  onToggleEspecial,
  onToggleFixo,
  onRemover,
}: {
  prato: CardapioDiaPrato
  diaData: string
  onPromoverDestaque: () => void
  onToggleEspecial: () => void
  onToggleFixo: () => void
  onRemover: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: prato.itemId,
      data: { type: 'item' as const, diaData },
    })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'flex cursor-grab items-center gap-1.5 rounded-md bg-muted px-2 py-1.5 touch-none active:cursor-grabbing',
        prato.especial && 'bg-amber-500/10',
        isDragging && 'z-10 shadow-lg'
      )}
    >
      <GripVertical
        aria-hidden
        className="size-3.5 shrink-0 text-muted-foreground"
      />

      <span className="min-w-0 flex-1 truncate text-sm">{prato.nome}</span>

      <button
        type="button"
        onClick={onToggleEspecial}
        aria-label={
          prato.especial
            ? `Tirar "${prato.nome}" de especial`
            : `Marcar "${prato.nome}" como especial (cobra adicional)`
        }
        className={cn(
          'flex size-6 shrink-0 items-center justify-center rounded hover:bg-accent',
          prato.especial
            ? 'text-amber-500'
            : 'text-muted-foreground hover:text-amber-500'
        )}
      >
        <Gem className={cn('size-3.5', prato.especial && 'fill-amber-500/30')} />
      </button>

      <button
        type="button"
        onClick={onToggleFixo}
        aria-label={
          prato.fixo
            ? `Parar de repetir "${prato.nome}" toda semana`
            : `Fixar "${prato.nome}" pra repetir todo esse dia da semana`
        }
        className={cn(
          'flex size-6 shrink-0 items-center justify-center rounded hover:bg-accent',
          prato.fixo ? 'text-sky-500' : 'text-muted-foreground hover:text-sky-500'
        )}
      >
        <Pin className={cn('size-3.5', prato.fixo && 'fill-sky-500/30')} />
      </button>

      {!prato.especial && (
        <button
          type="button"
          onClick={onPromoverDestaque}
          aria-label={`Marcar "${prato.nome}" como prato do dia`}
          className="flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-primary"
        >
          <Star className="size-3.5" />
        </button>
      )}

      <button
        type="button"
        onClick={onRemover}
        aria-label={`Remover "${prato.nome}" desse dia`}
        className="flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-destructive"
      >
        <X className="size-3.5" />
      </button>
    </div>
  )
}
