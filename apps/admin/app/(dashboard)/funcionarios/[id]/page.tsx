import { notFound } from 'next/navigation'

import { FuncionarioHeader } from '@/features/rh/components/detail/funcionario-header'
import { FuncionarioTabs } from '@/features/rh/components/detail/funcionario-tabs'
import { getCargos, getFuncionarioDetalhe } from '@/features/rh/lib/queries'
import { hojeISO } from '@/lib/formatters'

export default async function FuncionarioPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [funcionario, cargos] = await Promise.all([
    getFuncionarioDetalhe(id),
    getCargos(),
  ])

  if (!funcionario) {
    notFound()
  }

  const hoje = hojeISO()

  return (
    <div className="flex flex-col gap-8 p-4 sm:p-6">
      <FuncionarioHeader
        funcionario={funcionario}
        cargos={cargos}
        hoje={hoje}
      />
      <FuncionarioTabs funcionario={funcionario} hoje={hoje} />
    </div>
  )
}
