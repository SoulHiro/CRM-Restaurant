import { notFound } from 'next/navigation'

import { GarcomPage } from '@/features/mesas/components/garcom/garcom-page'
import {
  getComandasAbertas,
  getConfiguracaoSalao,
  getProdutosParaLancamento,
} from '@/features/mesas/lib/queries'
import { getActiveOrganizationId } from '@/lib/get-active-organization-id'

export default async function MesasPage() {
  const organizationId = await getActiveOrganizationId()
  if (!organizationId) notFound()

  const [comandas, configuracao, produtos] = await Promise.all([
    getComandasAbertas(organizationId),
    getConfiguracaoSalao(organizationId),
    getProdutosParaLancamento(organizationId),
  ])

  return (
    <GarcomPage
      organizationId={organizationId}
      quantidadeComandas={configuracao.quantidadeComandas}
      comandasIniciais={comandas}
      produtos={produtos}
    />
  )
}
