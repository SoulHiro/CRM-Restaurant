import type { EmpresaDetail, VisaoGeralOperacional } from '../../../../lib/types'
import { getProximaPausa } from '../../../../lib/overview-helpers'
import { FuncionariosPendentesCard } from './funcionarios-pendentes-card'
import { RespostasPorDiaCard } from './respostas-por-dia-card'
import { ResumoSemanaCard } from './resumo-semana-card'
import { SatisfacaoCard } from './satisfacao-card'

export function OverviewTab({
  detail,
  operacional,
}: {
  detail: EmpresaDetail
  operacional: VisaoGeralOperacional
}) {
  const { pausas, satisfacao, faturamentoMensal } = detail
  const {
    funcionariosAtivos,
    respostasSemanais,
    naoResponderam,
    taxaRespostaNumero,
    deltaTaxaResposta,
  } = operacional

  const proximaPausa = getProximaPausa(pausas)
  const taxaResposta =
    taxaRespostaNumero != null ? `${taxaRespostaNumero}%` : '—'
  const ultimoFaturamento =
    faturamentoMensal[faturamentoMensal.length - 1]?.valor

  return (
    <div className="grid grid-cols-3 gap-6 auto-rows-[minmax(0,26rem)] grid-rows-[minmax(0,29rem)]">
      <ResumoSemanaCard
        funcionariosAtivos={funcionariosAtivos}
        deltaFuncionarios={null}
        taxaResposta={taxaResposta}
        deltaTaxaResposta={deltaTaxaResposta}
        ultimoFaturamento={ultimoFaturamento}
        proximaPausa={proximaPausa}
      />
      <RespostasPorDiaCard respostasSemanais={respostasSemanais} />
      <FuncionariosPendentesCard
        naoResponderam={naoResponderam}
        totalFuncionarios={funcionariosAtivos}
      />
      <SatisfacaoCard satisfacao={satisfacao} />
    </div>
  )
}
