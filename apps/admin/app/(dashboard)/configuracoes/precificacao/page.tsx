import { PrecificacaoForm } from '@/features/configuracoes/components/precificacao-form'
import { getConfiguracaoPrecificacao } from '@/features/configuracoes/lib/queries'

export default async function PrecificacaoConfiguracoesPage() {
  const configuracao = await getConfiguracaoPrecificacao()

  return (
    <div className="max-w-2xl p-6">
      <PrecificacaoForm configuracaoInicial={configuracao} />
    </div>
  )
}
