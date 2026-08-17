import type { EmpresaDetail } from '../../../../lib/types'
import { getProximaPausa, percentChange } from '../../../../lib/overview-helpers'
import { FuncionariosPendentesCard } from './funcionarios-pendentes-card'
import { RespostasPorDiaCard } from './respostas-por-dia-card'
import { ResumoSemanaCard } from './resumo-semana-card'
import { SatisfacaoCard } from './satisfacao-card'

export function OverviewTab({ detail }: { detail: EmpresaDetail }) {
  const {
    respostasSemanais,
    funcionarios,
    pausas,
    satisfacao,
    faturamentoMensal,
    comparativoSemanaAnterior,
  } = detail

  const naoResponderam = funcionarios.filter(
    (f) => f.vinculoStatus === 'ativo' && !f.respondeuEstaSemana
  )
  const proximaPausa = getProximaPausa(pausas)

  const funcionariosAtivos = funcionarios.filter(
    (f) => f.vinculoStatus === 'ativo'
  ).length
  const totalRespostas = respostasSemanais.reduce(
    (soma, item) => soma + item.responderam + item.pendentes,
    0
  )
  const totalResponderam = respostasSemanais.reduce(
    (soma, item) => soma + item.responderam,
    0
  )
  const taxaRespostaNumero =
    totalRespostas > 0
      ? Math.round((totalResponderam / totalRespostas) * 100)
      : null
  const taxaResposta =
    taxaRespostaNumero != null ? `${taxaRespostaNumero}%` : '—'
  const ultimoFaturamento =
    faturamentoMensal[faturamentoMensal.length - 1]?.valor

  const deltaFuncionarios = percentChange(
    funcionariosAtivos,
    comparativoSemanaAnterior?.funcionariosAtivos
  )
  const deltaTaxaResposta =
    taxaRespostaNumero != null && comparativoSemanaAnterior
      ? taxaRespostaNumero - comparativoSemanaAnterior.taxaResposta
      : null

  return (
    <div className="grid grid-cols-3 gap-6 auto-rows-[minmax(0,26rem)] grid-rows-[minmax(0,29rem)]">
      <ResumoSemanaCard
        funcionariosAtivos={funcionariosAtivos}
        deltaFuncionarios={deltaFuncionarios}
        taxaResposta={taxaResposta}
        deltaTaxaResposta={deltaTaxaResposta}
        ultimoFaturamento={ultimoFaturamento}
        proximaPausa={proximaPausa}
      />
      <RespostasPorDiaCard respostasSemanais={respostasSemanais} />
      <FuncionariosPendentesCard
        naoResponderam={naoResponderam}
        totalFuncionarios={funcionarios.length}
      />
      <SatisfacaoCard satisfacao={satisfacao} />
    </div>
  )
}
