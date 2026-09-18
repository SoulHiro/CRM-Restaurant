import { notFound } from 'next/navigation'

import { FornecedorHeader } from '@/features/compras/components/detail/fornecedor-header'
import { FornecedorTabs } from '@/features/compras/components/detail/fornecedor-tabs'
import { getFornecedorDetalhe } from '@/features/compras/lib/queries'
import { getEstoqueItensAtivos } from '@/features/estoque/lib/queries'
import { hojeISO } from '@/lib/formatters'
import { getActiveOrganizationId } from '@/lib/get-active-organization-id'

export default async function FornecedorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const organizationId = await getActiveOrganizationId()
  const [fornecedor, itens] = await Promise.all([
    getFornecedorDetalhe(id),
    organizationId ? getEstoqueItensAtivos(organizationId) : [],
  ])

  if (!fornecedor) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-8 p-4 sm:p-6">
      <FornecedorHeader fornecedor={fornecedor} hoje={hojeISO()} />
      <FornecedorTabs fornecedor={fornecedor} itens={itens} />
    </div>
  )
}
