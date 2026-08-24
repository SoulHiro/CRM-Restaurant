import { EmptyState } from '@repo/ui/components/empty-state'

import type { ProdutoListItem } from '../../lib/types'
import { ProdutoRow } from './produto-row'

export function ProdutosTable({
  produtos,
  vazioMensagem,
}: {
  produtos: ProdutoListItem[]
  vazioMensagem: string
}) {
  if (produtos.length === 0) {
    return <EmptyState message={vazioMensagem} />
  }

  return (
    <div className="flex flex-col gap-2">
      {produtos.map((produto) => (
        <ProdutoRow key={produto.id} produto={produto} />
      ))}
    </div>
  )
}
