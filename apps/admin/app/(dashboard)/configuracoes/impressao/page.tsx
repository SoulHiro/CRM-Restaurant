import { ComandaLayoutConfig } from '@/features/configuracoes/components/comanda-layout-config'
import {
  getConfiguracaoComanda,
  listarImpressorasComanda,
} from '@/features/configuracoes/lib/queries'

export default async function ImpressaoConfiguracoesPage() {
  const [configuracaoComanda, impressoras] = await Promise.all([
    getConfiguracaoComanda(),
    listarImpressorasComanda(),
  ])

  return (
    <div className="p-6">
      <ComandaLayoutConfig
        configuracaoInicial={configuracaoComanda}
        impressorasIniciais={impressoras}
      />
    </div>
  )
}
