'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

import { Checkbox } from '@repo/ui/components/checkbox'
import { cn } from '@repo/ui/lib/utils'

import { CAMPO_RESUMO_LABEL, type CampoResumoKey } from '../lib/types'

export function ResumoCampoRow({
  campo,
  ativo,
  onToggle,
}: {
  campo: CampoResumoKey
  ativo: boolean
  onToggle: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: campo })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        'flex items-center justify-between gap-3 rounded-lg bg-muted px-3 py-2.5 transition-opacity',
        !ativo && 'opacity-60',
        isDragging && 'z-10 shadow-lg'
      )}
    >
      <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
        <Checkbox
          checked={ativo}
          onCheckedChange={onToggle}
          aria-label={`Mostrar "${CAMPO_RESUMO_LABEL[campo]}" na nota`}
        />
        <span className="truncate text-sm">{CAMPO_RESUMO_LABEL[campo]}</span>
      </label>

      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Arrastar "${CAMPO_RESUMO_LABEL[campo]}" pra reordenar`}
        className="flex size-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-accent active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </button>
    </div>
  )
}
