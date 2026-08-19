import { DadosEmpresaForm } from '@/features/configuracoes/components/dados-empresa-form'
import { getConfiguracaoResumoDia } from '@/features/configuracoes/lib/queries'

export default async function DadosEmpresaPage() {
  const configuracao = await getConfiguracaoResumoDia()

  return (
    <div className="max-w-2xl p-6">
      <DadosEmpresaForm configuracaoInicial={configuracao} />
    </div>
  )
}
