import { ImageOff } from 'lucide-react'

import { Badge } from '@repo/ui/components/badge'

import { formatCurrencyBRL } from '@/lib/formatters'
import type { AdicionalItemOption } from '../../lib/types'

export function ItemRow({ item }: { item: AdicionalItemOption }) {
  return (
    <div className="flex items-center gap-4 rounded-lg bg-card p-3">
      {item.fotoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.fotoUrl}
          alt=""
          className="size-10 shrink-0 rounded-md object-cover"
        />
      ) : (
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
          <ImageOff className="size-4 text-muted-foreground" />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium">{item.nome}</span>
        <span className="truncate text-xs text-muted-foreground">
          Mín {item.quantidadeMinima} · Máx {item.quantidadeMaxima}
        </span>
      </div>

      <span className="text-sm tabular-nums text-muted-foreground">
        {formatCurrencyBRL(item.preco)}
      </span>

      {!item.ativo && <Badge variant="destructive">Inativo</Badge>}
    </div>
  )
}
