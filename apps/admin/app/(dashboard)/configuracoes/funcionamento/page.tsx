import { HorarioFuncionamentoForm } from '@/features/configuracoes/components/horario-funcionamento-form'
import { getConfiguracaoHorarioFuncionamento } from '@/features/configuracoes/lib/queries'

export default async function FuncionamentoConfiguracoesPage() {
  const configuracao = await getConfiguracaoHorarioFuncionamento()

  return (
    <div className="max-w-2xl p-6">
      <HorarioFuncionamentoForm configuracaoInicial={configuracao} />
    </div>
  )
}
