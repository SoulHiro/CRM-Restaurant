import { EmptyState } from '@repo/ui/components/empty-state'

import type { EstoqueItem } from '@/features/estoque/lib/types'
import { formatCurrencyBRL } from '@/lib/formatters'
import type { FornecedorListItem, SugestaoGrupo } from '../../lib/types'
import { SugestaoFornecedorCard } from './sugestao-fornecedor-card'

export function SugestaoTab({
  grupos,
  fornecedores,
  itens,
  precosPorFornecedor,
  hoje,
}: {
  grupos: SugestaoGrupo[]
  fornecedores: FornecedorListItem[]
  itens: EstoqueItem[]
  precosPorFornecedor: Record<string, number>
  hoje: string
}) {
  if (grupos.length === 0) {
    return (
      <EmptyState message="Nada abaixo do ponto de reposição. Quando algum item cair, ele aparece aqui já agrupado pelo fornecedor." />
    )
  }

  const totalItens = grupos.reduce((soma, grupo) => soma + grupo.itens.length, 0)
  const custoTotal = grupos.reduce((soma, grupo) => soma + grupo.custoEstimado, 0)

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {totalItens} {totalItens === 1 ? 'item precisa' : 'itens precisam'} de
        reposição
        {custoTotal > 0 && (
          <>
            , cerca de{' '}
            <span className="font-medium text-foreground">
              {formatCurrencyBRL(custoTotal)}
            </span>{' '}
            pelo último preço pago
          </>
        )}
        .
      </p>

      {grupos.map((grupo) => (
        <SugestaoFornecedorCard
          key={grupo.fornecedorId ?? 'sem-fornecedor'}
          grupo={grupo}
          fornecedores={fornecedores}
          itens={itens}
          precosPorFornecedor={precosPorFornecedor}
          hoje={hoje}
        />
      ))}
    </div>
  )
}
