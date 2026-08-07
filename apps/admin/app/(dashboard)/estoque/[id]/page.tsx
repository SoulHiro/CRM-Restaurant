import { notFound } from 'next/navigation'

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
  const detalhe = await getEstoqueItemDetalhe(id)

  if (!detalhe) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-8 p-4 sm:p-6">
      <ItemHeader item={detalhe.item} hoje={hojeISO()} />
      <ItemTabs detalhe={detalhe} />
    </div>
  )
}
