import type { EmpresaDetail } from '../../../../lib/types'
import {
  getEnviosPorDia,
  getProximaPausa,
  percentChange,
} from '../../../../lib/overview-helpers'
import { EnviosComErroCard } from './envios-com-erro-card'
import { FaturamentoCard } from './faturamento-card'
import { FuncionariosPendentesCard } from './funcionarios-pendentes-card'
import { PedidosEnviadosCard } from './pedidos-enviados-card'
import { ProximaPausaCard } from './proxima-pausa-card'
import { RespostasPorDiaCard } from './respostas-por-dia-card'
import { ResumoSemanaCard } from './resumo-semana-card'
import { SatisfacaoCard } from './satisfacao-card'
import { ValidadeContratoCard } from './validade-contrato-card'

export function OverviewTab({ detail }: { detail: EmpresaDetail }) {
  const {
    respostasSemanais,
    envios,
    funcionarios,
    contrato,
    pausas,
    satisfacao,
    faturamentoMensal,
    comparativoSemanaAnterior,
  } = detail

  const enviosPorDia = getEnviosPorDia(envios)
  const naoResponderam = funcionarios.filter(
    (f) => f.vinculoStatus === 'ativo' && !f.respondeuEstaSemana
  )
  const enviosComErro = envios.filter((envio) => envio.status === 'erro')
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
  const deltaPedidos = percentChange(
    envios.length,
    comparativoSemanaAnterior?.pedidosEnviados
  )
  const deltaTaxaResposta =
    taxaRespostaNumero != null && comparativoSemanaAnterior
      ? taxaRespostaNumero - comparativoSemanaAnterior.taxaResposta
      : null

  return (
    <div className="grid grid-cols-3 gap-6 auto-rows-[minmax(0,26rem)]">
      <ResumoSemanaCard
        funcionariosAtivos={funcionariosAtivos}
        deltaFuncionarios={deltaFuncionarios}
        pedidosEnviados={envios.length}
        deltaPedidos={deltaPedidos}
        taxaResposta={taxaResposta}
        deltaTaxaResposta={deltaTaxaResposta}
        ultimoFaturamento={ultimoFaturamento}
        proximaPausa={proximaPausa}
      />
      <RespostasPorDiaCard respostasSemanais={respostasSemanais} />
      <PedidosEnviadosCard enviosPorDia={enviosPorDia} />
      <FuncionariosPendentesCard
        naoResponderam={naoResponderam}
        totalFuncionarios={funcionarios.length}
      />
      <ValidadeContratoCard contrato={contrato} />
      <EnviosComErroCard envios={enviosComErro} />
      <ProximaPausaCard pausa={proximaPausa} />
      <SatisfacaoCard satisfacao={satisfacao} />
      <FaturamentoCard faturamentoMensal={faturamentoMensal} />
    </div>
  )
}
