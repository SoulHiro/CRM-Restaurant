import {
  calcularDRE,
  despesaPorSubtipo,
  receitaPorOrigem,
} from '../../lib/dre-helpers'
import { resumirContas } from '../../lib/conta-helpers'
import { calcularProgressoMeta } from '../../lib/meta-helpers'
import type {
  AjusteMeta,
  ContaPagar,
  ContaReceber,
  Meta,
  Transacao,
} from '../../lib/types'
import { DreCard } from './dre-card'
import { MetaCard } from './meta-card'
import { OrigemBreakdownCard } from './origem-breakdown-card'
import { ResumoContasCard } from './resumo-contas-card'

export function VisaoGeralTab({
  transacoesDoMes,
  contasPagar,
  contasReceber,
  meta,
  transacoesDaMeta,
  ajustesMeta,
  mes,
  hoje,
}: {
  transacoesDoMes: Transacao[]
  contasPagar: ContaPagar[]
  contasReceber: ContaReceber[]
  meta: Meta | null
  transacoesDaMeta: Transacao[]
  ajustesMeta: AjusteMeta[]
  mes: string
  hoje: string
}) {
  const dre = calcularDRE(transacoesDoMes)
  const resumo = resumirContas(contasPagar, contasReceber, hoje)
  const progresso = meta
    ? calcularProgressoMeta(meta, transacoesDaMeta, ajustesMeta, hoje)
    : null

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <DreCard dre={dre} mes={mes} />
      <MetaCard progresso={progresso} hoje={hoje} />
      <OrigemBreakdownCard
        receitas={receitaPorOrigem(transacoesDoMes)}
        despesas={despesaPorSubtipo(transacoesDoMes)}
      />
      <ResumoContasCard resumo={resumo} />
    </div>
  )
}
