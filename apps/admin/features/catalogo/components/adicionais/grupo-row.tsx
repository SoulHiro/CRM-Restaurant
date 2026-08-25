import Link from 'next/link'

import { Badge } from '@repo/ui/components/badge'

import type { GrupoAdicionalOption } from '../../lib/types'

export function GrupoRow({ grupo }: { grupo: GrupoAdicionalOption }) {
  return (
    <Link
      href={`/catalogo/adicionais/${grupo.id}`}
      className="flex items-center gap-4 rounded-lg bg-card p-3 transition-colors hover:bg-accent/50"
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium">{grupo.nome}</span>
        <span className="truncate text-xs text-muted-foreground">
          {grupo.itens.length}{' '}
          {grupo.itens.length === 1 ? 'item' : 'itens'}
        </span>
      </div>

      <div className="flex gap-1">
        {grupo.disponivelAlmoco && <Badge variant="outline">Almoço</Badge>}
        {grupo.disponivelJanta && <Badge variant="outline">Janta</Badge>}
      </div>

      {!grupo.ativo && <Badge variant="destructive">Inativo</Badge>}
    </Link>
  )
}
