import Link from 'next/link'

import { Badge } from '@repo/ui/components/badge'

import { formatCurrencyBRL } from '@/lib/formatters'
import { TIPO_PRODUTO_LABEL } from '../../lib/types'
import type { ProdutoListItem } from '../../lib/types'
import { DuplicarProdutoButton } from './duplicar-produto-button'

export function ProdutoRow({ produto }: { produto: ProdutoListItem }) {
  return (
    <div className="flex items-center rounded-lg bg-card hover:bg-accent/50">
      <Link
        href={`/catalogo/produtos/${produto.id}/editar`}
        className="flex min-w-0 flex-1 items-center gap-4 p-3"
      >
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-medium">{produto.nome}</span>
          <span className="truncate text-xs text-muted-foreground">
            {TIPO_PRODUTO_LABEL[produto.tipo]}
            {produto.categoriaNome && ` · ${produto.categoriaNome}`}
          </span>
        </div>

        <span className="text-sm tabular-nums text-muted-foreground">
          {produto.temTamanhos
            ? produto.precoMinimo == null
              ? '—'
              : `A partir de ${formatCurrencyBRL(produto.precoMinimo)}`
            : produto.precoVenda == null
              ? '—'
              : formatCurrencyBRL(produto.precoVenda)}
        </span>

        {produto.pausadoHoje && (
          <Badge variant="secondary">Pausado hoje</Badge>
        )}

        {!produto.ativo && <Badge variant="destructive">Inativo</Badge>}
      </Link>

      <DuplicarProdutoButton produtoId={produto.id} />
    </div>
  )
}
