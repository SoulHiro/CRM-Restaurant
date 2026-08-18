import { notFound } from 'next/navigation'

import { EmpresaHeader } from '@/features/empresas/components/detail/empresa-header'
import { EmpresaTabs } from '@/features/empresas/components/detail/empresa-tabs'
import {
  getEmpresaById,
  getEmpresaDetail,
  getFaturamentoMensal,
} from '@/features/empresas/lib/queries'

export default async function EmpresaDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { id } = await params
  const empresa = await getEmpresaById(id)

  if (!empresa) {
    notFound()
  }

  const [detailMock, faturamentoMensal] = await Promise.all([
    getEmpresaDetail(id),
    getFaturamentoMensal(id),
  ])
  // Faturamento já é real (soma de fechamento_dia_empresa.valor_total) —
  // sobrepõe o campo mock só nesse ponto, sem mexer em getEmpresaDetail
  // (o resto de EmpresaDetail continua mock).
  const detail = { ...detailMock, faturamentoMensal }
  const resolvedSearchParams = await searchParams

  return (
    <div className="flex flex-col gap-8 p-6">
      <EmpresaHeader empresa={empresa} status={detail.status} />
      <EmpresaTabs
        empresa={empresa}
        detail={detail}
        searchParams={resolvedSearchParams}
      />
    </div>
  )
}
