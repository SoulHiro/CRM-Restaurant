import { ComandaLayoutConfig } from '@/features/configuracoes/components/comanda-layout-config'
import {
  getConfiguracaoComanda,
  getConfiguracaoResumoDia,
  listarImpressorasComanda,
} from '@/features/configuracoes/lib/queries'

export default async function ImpressaoConfiguracoesPage() {
  const [configuracaoComanda, impressoras, configuracaoResumoDia] =
    await Promise.all([
      getConfiguracaoComanda(),
      listarImpressorasComanda(),
      getConfiguracaoResumoDia(),
    ])

  return (
    <div className="p-6">
      <ComandaLayoutConfig
        configuracaoInicial={configuracaoComanda}
        impressorasIniciais={impressoras}
        configuracaoResumoDiaInicial={configuracaoResumoDia}
      />
    </div>
  )
}
