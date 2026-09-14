'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Pin, Star, X } from 'lucide-react'

import { cn } from '@repo/ui/lib/utils'

import { formatDateBR, formatDiaSemanaBR, hojeISO } from '@/lib/formatters'
import type { CardapioDiaItem } from '../lib/types'
import { CardapioItemRow } from './cardapio-item-row'

/** Uma coluna do calendário semanal — alvo do drag-and-drop do catálogo, e dono da lista ordenável de alternativas. */
export function CardapioDiaCelula({
  dia,
  onPromoverDestaque,
  onRemoverDestaque,
  onToggleEspecial,
  onToggleFixo,
  onRemoverItem,
}: {
  dia: CardapioDiaItem
  onPromoverDestaque: (itemId: string) => void
  onRemoverDestaque: () => void
  onToggleEspecial: (itemId: string, especial: boolean) => void
  onToggleFixo: (itemId: string, fixo: boolean) => void
  onRemoverItem: (itemId: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `dia:${dia.data}`,
    data: { type: 'dia' as const, data: dia.data },
  })

  const hoje = dia.data === hojeISO()

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex min-h-64 flex-col gap-2 rounded-lg bg-muted/40 p-2.5 transition-colors',
        isOver && 'bg-accent'
      )}
    >
      <p
        className={cn(
          'text-xs font-semibold uppercase tracking-wide text-muted-foreground',
          hoje && 'text-primary'
        )}
      >
        {formatDiaSemanaBR(dia.data).slice(0, 3)} ·{' '}
        {formatDateBR(dia.data).slice(0, 5)}
      </p>

      {dia.destaque ? (
        <div className="flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-2 py-1.5">
          <Star className="size-3.5 shrink-0 fill-primary text-primary" />
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-primary">
            {dia.destaque.nome}
          </span>
          <button
            type="button"
            onClick={() => onToggleFixo(dia.destaque!.itemId, !dia.destaque!.fixo)}
            aria-label={
              dia.destaque.fixo
                ? `Parar de repetir "${dia.destaque.nome}" toda semana`
                : `Fixar "${dia.destaque.nome}" pra repetir todo esse dia da semana`
            }
            className={cn(
              'flex size-6 shrink-0 items-center justify-center rounded hover:bg-primary/10',
              dia.destaque.fixo
                ? 'text-sky-500'
                : 'text-primary/70 hover:text-sky-500'
            )}
          >
            <Pin
              className={cn('size-3.5', dia.destaque.fixo && 'fill-sky-500/30')}
            />
          </button>
          <button
            type="button"
            onClick={onRemoverDestaque}
            aria-label={`Tirar destaque de "${dia.destaque.nome}"`}
            className="flex size-6 shrink-0 items-center justify-center rounded text-primary/70 hover:bg-primary/10 hover:text-primary"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <p className="rounded-md border border-dashed px-2 py-1.5 text-xs text-muted-foreground">
          Sem prato do dia ainda
        </p>
      )}

      <SortableContext
        items={dia.alternativas.map((a) => a.itemId)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-1 flex-col gap-1">
          {dia.alternativas.map((prato) => (
            <CardapioItemRow
              key={prato.itemId}
              prato={prato}
              diaData={dia.data}
              onPromoverDestaque={() => onPromoverDestaque(prato.itemId)}
              onToggleEspecial={() =>
                onToggleEspecial(prato.itemId, !prato.especial)
              }
              onToggleFixo={() => onToggleFixo(prato.itemId, !prato.fixo)}
              onRemover={() => onRemoverItem(prato.itemId)}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}
