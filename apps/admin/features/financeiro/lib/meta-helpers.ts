import { arredondarMoeda } from '@/lib/numeric'
import { calcularDRE } from './dre-helpers'
import type { AjusteMeta, Meta, ProgressoMeta, Transacao } from './types'

const MS_POR_DIA = 86_400_000

export function diasEntre(de: string, ate: string): number {
  const inicio = Date.parse(`${de.slice(0, 10)}T00:00:00Z`)
  const fim = Date.parse(`${ate.slice(0, 10)}T00:00:00Z`)
  return Math.round((fim - inicio) / MS_POR_DIA)
}

/**
 * O quanto já foi guardado sai de duas fontes somadas:
 * 1. o lucro do livro-razão dentro da janela da meta (automático);
 * 2. os aportes/retiradas lançados à mão, que o DRE não enxerga.
 *
 * Nada disso é snapshot — recalcula sempre, então nunca fica defasado.
 */
export function calcularProgressoMeta(
  meta: Meta,
  transacoes: Transacao[],
  ajustes: AjusteMeta[],
  hoje: string
): ProgressoMeta {
  const noPeriodo = transacoes.filter(
    (t) => t.data >= meta.inicio && t.data <= meta.prazo
  )
  const lucroPeriodo = calcularDRE(noPeriodo).lucro
  const somaAjustes = ajustes.reduce((soma, a) => soma + a.valor, 0)

  const acumulado = arredondarMoeda(lucroPeriodo + somaAjustes)
  const alvo = meta.valorAlvo ?? 0
  const falta = arredondarMoeda(Math.max(alvo - acumulado, 0))

  const diasRestantes = Math.max(diasEntre(hoje, meta.prazo), 0)
  // Arredonda pra cima: com 8 dias restando, o ritmo é de 2 semanas, não 1.
  const semanasRestantes = Math.max(Math.ceil(diasRestantes / 7), 0)

  return {
    meta,
    lucroPeriodo,
    ajustes: arredondarMoeda(somaAjustes),
    acumulado,
    falta,
    percentual: alvo > 0 ? Math.round((acumulado / alvo) * 1000) / 10 : 0,
    diasRestantes,
    semanasRestantes,
    ritmoSemanal:
      semanasRestantes > 0 ? arredondarMoeda(falta / semanasRestantes) : falta,
    atingida: alvo > 0 && acumulado >= alvo,
    vencida: diasEntre(hoje, meta.prazo) < 0,
  }
}
