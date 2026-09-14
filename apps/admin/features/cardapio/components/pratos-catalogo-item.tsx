'use client'

import { useDraggable } from '@dnd-kit/core'
import { GripVertical } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/components/dropdown-menu'
import { cn } from '@repo/ui/lib/utils'

import {
  CATEGORIA_PRATO_ICON,
  CATEGORIA_PRATO_LABEL,
  CATEGORIAS_PRATO,
  type CategoriaPrato,
} from '../lib/categoria-prato'
import type { PratoCatalogoItem } from '../lib/types'

/**
 * Item de origem do drag-and-drop — arrastar daqui pra um dia do calendário
 * *copia* o prato pro dia (não move/remove daqui), por isso não é
 * `useSortable`: o catálogo não tem ordem própria, só serve de fonte. O
 * item inteiro é a alça — não só o ícone de pontinhos, que fica só como
 * indicação visual.
 */
export function PratosCatalogoItem({
  prato,
  onMudarCategoria,
}: {
  prato: PratoCatalogoItem
  onMudarCategoria: (categoria: CategoriaPrato) => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `catalogo:${prato.id}`,
    data: { type: 'catalogo' as const, pratoId: prato.id, nome: prato.nome },
  })

  const Icone = CATEGORIA_PRATO_ICON[prato.categoria]

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        'flex cursor-grab items-center gap-2 rounded-lg bg-muted px-2.5 py-2 touch-none active:cursor-grabbing',
        isDragging && 'opacity-40'
      )}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            aria-label={`Categoria: ${CATEGORIA_PRATO_LABEL[prato.categoria]} — clique pra mudar`}
            className="flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Icone className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {CATEGORIAS_PRATO.map((categoria) => {
            const ItemIcone = CATEGORIA_PRATO_ICON[categoria]
            return (
              <DropdownMenuItem
                key={categoria}
                onSelect={() => onMudarCategoria(categoria)}
              >
                <ItemIcone className="size-4" />
                {CATEGORIA_PRATO_LABEL[categoria]}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <span className="min-w-0 flex-1 truncate text-sm">{prato.nome}</span>

      <GripVertical aria-hidden className="size-4 shrink-0 text-muted-foreground" />
    </div>
  )
}
