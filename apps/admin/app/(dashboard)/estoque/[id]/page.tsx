import { notFound } from 'next/navigation'

import { getFornecedores } from '@/features/compras/lib/queries'
import { ItemHeader } from '@/features/estoque/components/detail/item-header'
import { ItemTabs } from '@/features/estoque/components/detail/item-tabs'
import { getEstoqueItemDetalhe } from '@/features/estoque/lib/queries'
import { hojeISO } from '@/lib/formatters'

export default async function EstoqueItemPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [detalhe, fornecedores] = await Promise.all([
    getEstoqueItemDetalhe(id),
    getFornecedores(),
  ])

  if (!detalhe) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-8 p-4 sm:p-6">
      <ItemHeader
        item={detalhe.item}
        fornecedores={fornecedores}
        hoje={hojeISO()}
      />
      <ItemTabs detalhe={detalhe} />
    </div>
  )
}
