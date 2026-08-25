import { Badge } from '@repo/ui/components/badge'

import { formatCurrencyBRL } from '@/lib/formatters'
import { TIPO_PRODUTO_LABEL } from '../../lib/types'
import type { ProdutoListItem } from '../../lib/types'

export function ProdutoRow({ produto }: { produto: ProdutoListItem }) {
  const soUmTurno = produto.apareceAlmoco !== produto.apareceJanta

  return (
    <div className="flex items-center gap-4 rounded-lg bg-card p-3">
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium">{produto.nome}</span>
        <span className="truncate text-xs text-muted-foreground">
          {TIPO_PRODUTO_LABEL[produto.tipo]}
          {produto.categoriaNome && ` · ${produto.categoriaNome}`}
        </span>
      </div>

      <span className="text-sm tabular-nums text-muted-foreground">
        {produto.precoVenda == null
          ? '—'
          : formatCurrencyBRL(produto.precoVenda)}
      </span>

      <div className="flex gap-1">
        {produto.disponivelDelivery && (
          <Badge variant="outline">Delivery</Badge>
        )}
        {produto.disponivelLocal && <Badge variant="outline">Local</Badge>}
        {soUmTurno && (
          <Badge variant="outline">
            Só {produto.apareceAlmoco ? 'almoço' : 'janta'}
          </Badge>
        )}
      </div>

      {produto.pausadoHoje && <Badge variant="secondary">Pausado hoje</Badge>}

      {!produto.ativo && <Badge variant="destructive">Inativo</Badge>}
    </div>
  )
}
