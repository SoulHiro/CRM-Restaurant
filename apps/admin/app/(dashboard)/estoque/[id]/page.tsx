import { headers } from 'next/headers'
import { notFound } from 'next/navigation'

import { getFornecedores } from '@/features/compras/lib/queries'
import { ItemHeader } from '@/features/estoque/components/detail/item-header'
import { ItemTabs } from '@/features/estoque/components/detail/item-tabs'
import { getEstoqueItemDetalhe } from '@/features/estoque/lib/queries'
import { auth } from '@/lib/auth'
import { getActiveOrganizationId } from '@/lib/get-active-organization-id'
import { hojeISO } from '@/lib/formatters'

export default async function EstoqueItemPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const organizationId = await getActiveOrganizationId()
  if (!organizationId) notFound()

  const [detalhe, fornecedores, session] = await Promise.all([
    getEstoqueItemDetalhe(organizationId, id),
    getFornecedores(),
    auth.api.getSession({ headers: await headers() }),
  ])

  if (!detalhe) {
    notFound()
  }

  const role = (session?.user as { role?: string } | undefined)?.role

  return (
    <div className="flex flex-col gap-8 p-4 sm:p-6">
      <ItemHeader
        item={detalhe.item}
        fornecedores={fornecedores}
        hoje={hojeISO()}
        isAdmin={role === 'admin'}
      />
      <ItemTabs detalhe={detalhe} />
    </div>
  )
}
