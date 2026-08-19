import { ComandaLayoutConfig } from '@/features/configuracoes/components/comanda-layout-config'
import {
  getConfiguracaoComanda,
  getConfiguracaoLayoutResumo,
  listarImpressorasComanda,
} from '@/features/configuracoes/lib/queries'

export default async function ImpressaoConfiguracoesPage() {
  const [configuracaoComanda, impressoras, layoutResumo] = await Promise.all([
    getConfiguracaoComanda(),
    listarImpressorasComanda(),
    getConfiguracaoLayoutResumo(),
  ])

  return (
    <div className="p-6">
      <ComandaLayoutConfig
        configuracaoInicial={configuracaoComanda}
        impressorasIniciais={impressoras}
        layoutResumoInicial={layoutResumo}
      />
    </div>
  )
}
