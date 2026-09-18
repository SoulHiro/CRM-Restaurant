import { notFound } from 'next/navigation'

import { PrecificacaoForm } from '@/features/configuracoes/components/precificacao-form'
import { getConfiguracaoPrecificacao } from '@/features/configuracoes/lib/queries'
import { getActiveOrganizationId } from '@/lib/get-active-organization-id'

export default async function PrecificacaoConfiguracoesPage() {
  const organizationId = await getActiveOrganizationId()
  if (!organizationId) notFound()

  const configuracao = await getConfiguracaoPrecificacao(organizationId)

  return (
    <div className="max-w-2xl p-6">
      <PrecificacaoForm configuracaoInicial={configuracao} />
    </div>
  )
}
