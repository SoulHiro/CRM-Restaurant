import { Badge } from '@repo/ui/components/badge'

import { formatCurrencyBRL } from '@/lib/formatters'
import {
  DISPONIBILIDADE_STATUS_LABEL,
  TIPO_PRODUTO_LABEL,
} from '../../lib/types'
import type { ProdutoListItem } from '../../lib/types'

export function ProdutoRow({ produto }: { produto: ProdutoListItem }) {
  return (
    <div className="flex items-center gap-4 rounded-lg border bg-card p-3">
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
      </div>

      <Badge
        variant={
          produto.disponibilidadeStatus === 'disponivel'
            ? 'default'
            : 'secondary'
        }
      >
        {DISPONIBILIDADE_STATUS_LABEL[produto.disponibilidadeStatus]}
      </Badge>

      {!produto.ativo && <Badge variant="destructive">Inativo</Badge>}
    </div>
  )
}
