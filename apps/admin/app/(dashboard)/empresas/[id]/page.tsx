import { headers } from 'next/headers'
import { notFound } from 'next/navigation'

import { auth } from '@/lib/auth'
import { EmpresaHeader } from '@/features/empresas/components/detail/empresa-header'
import { EmpresaTabs } from '@/features/empresas/components/detail/empresa-tabs'
import {
  getEmpresaById,
  getEmpresaDetail,
  getFaturamentoMensal,
  getVisaoGeralOperacional,
} from '@/features/empresas/lib/queries'

export default async function EmpresaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const empresa = await getEmpresaById(id)

  if (!empresa) {
    notFound()
  }

  const [detailMock, faturamentoMensal, operacional, session] =
    await Promise.all([
      getEmpresaDetail(id),
      getFaturamentoMensal(id),
      getVisaoGeralOperacional(id),
      auth.api.getSession({ headers: await headers() }),
    ])
  // Faturamento já é real (soma de fechamento_dia_empresa.valor_total) —
  // sobrepõe o campo mock só nesse ponto, sem mexer em getEmpresaDetail
  // (o resto de EmpresaDetail continua mock).
  const detail = { ...detailMock, faturamentoMensal }
  const role = (session?.user as { role?: string } | undefined)?.role

  return (
    <div className="flex flex-col gap-8 p-6">
      <EmpresaHeader empresa={empresa} status={detail.status} />
      <EmpresaTabs
        empresa={empresa}
        detail={detail}
        operacional={operacional}
        role={role}
      />
    </div>
  )
}
