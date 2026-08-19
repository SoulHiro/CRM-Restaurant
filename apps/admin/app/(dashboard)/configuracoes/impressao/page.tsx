import { ComandaLayoutConfig } from '@/features/configuracoes/components/comanda-layout-config'
import {
  getConfiguracaoComanda,
  getConfiguracaoLayoutResumo,
  getConfiguracaoResumoDia,
  listarImpressorasComanda,
} from '@/features/configuracoes/lib/queries'

export default async function ImpressaoConfiguracoesPage() {
  const [
    configuracaoComanda,
    impressoras,
    configuracaoResumoDia,
    layoutResumo,
  ] = await Promise.all([
    getConfiguracaoComanda(),
    listarImpressorasComanda(),
    getConfiguracaoResumoDia(),
    getConfiguracaoLayoutResumo(),
  ])

  return (
    <div className="p-6">
      <ComandaLayoutConfig
        configuracaoInicial={configuracaoComanda}
        impressorasIniciais={impressoras}
        configuracaoResumoDiaInicial={configuracaoResumoDia}
        layoutResumoInicial={layoutResumo}
      />
    </div>
  )
}
