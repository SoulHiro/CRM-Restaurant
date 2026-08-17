import { ComandaLayoutConfig } from '@/features/configuracoes/components/comanda-layout-config'
import { getConfiguracaoComanda } from '@/features/configuracoes/lib/queries'

export default async function ConfiguracoesPage() {
  const configuracaoComanda = await getConfiguracaoComanda()

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">Configurações</h1>
      <ComandaLayoutConfig configuracaoInicial={configuracaoComanda} />
    </div>
  )
}
