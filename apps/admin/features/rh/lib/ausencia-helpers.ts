import type { AusenciaTipo } from './types'
import { diasEntre } from './salario-helpers'

export const AUSENCIA_LABELS: Record<AusenciaTipo, string> = {
  atestado_medico: 'Atestado médico',
  folga: 'Folga',
  ferias: 'Férias',
  falta_justificada: 'Falta justificada',
  falta_injustificada: 'Falta injustificada',
}

export const DIAS_DA_SEMANA = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
] as const

export const DOMINGO = 0
export const SABADO = 6

/** Ausência de um dia só conta 1, não 0 — as duas pontas entram. */
export function diasDeAusencia(dataInicio: string, dataFim: string): number {
  return Math.max(0, diasEntre(dataInicio, dataFim) + 1)
}

export function primeiroDiaDoMes(competencia: string): string {
  return `${competencia}-01`
}

export function ultimoDiaDoMes(competencia: string): string {
  const [ano, mes] = competencia.split('-').map(Number)
  if (!ano || !mes) return `${competencia}-28`
  // Dia 0 do mês seguinte = último dia deste, já resolvendo fevereiro
  // bissexto sem tabela de dias por mês.
  const dia = new Date(Date.UTC(ano, mes, 0)).getUTCDate()
  return `${competencia}-${String(dia).padStart(2, '0')}`
}

export function somarDiasISO(data: string, dias: number): string {
  const [ano, mes, dia] = data.split('-').map(Number)
  if (!ano || !mes || !dia) return data
  return new Date(Date.UTC(ano, mes - 1, dia + dias)).toISOString().slice(0, 10)
}

function diaDaSemana(data: string): number {
  const [ano, mes, dia] = data.split('-').map(Number)
  if (!ano || !mes || !dia) return -1
  return new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay()
}

export function segundaDaSemana(data: string): string {
  const semana = diaDaSemana(data)
  if (semana < 0) return data
  // Domingo pertence à semana que começou na segunda anterior, daí o 6.
  return somarDiasISO(data, -(semana === DOMINGO ? 6 : semana - 1))
}

/**
 * Primeira ocorrência do dia de pagamento em ou depois do fim da semana.
 * Pagando no sábado, a semana vence no próprio sábado dela; pagando na
 * quarta, vence na quarta seguinte.
 */
export function vencimentoDaSemana(
  fimDaSemana: string,
  diaPagamento: number
): string {
  const semana = diaDaSemana(fimDaSemana)
  if (semana < 0) return fimDaSemana
  return somarDiasISO(fimDaSemana, (diaPagamento - semana + 7) % 7)
}

interface Periodo {
  dataInicio: string
  dataFim: string
}

export interface SemanaPaga {
  /** Segunda-feira da semana. */
  inicio: string
  /** Sábado da semana. */
  fim: string
  diarias: number
  vencimento: string
}

interface SemanasParams {
  ausencias: readonly Periodo[]
  folgaSemanal: number | null | undefined
  competencia: string
  diaPagamento: number
  /** Data de admissão: nada antes dela conta. */
  desde?: string | null
  /** Data de desligamento: nada depois dela conta. */
  ate?: string | null
}

/**
 * As semanas **pagas** dentro da competência, inteiras.
 *
 * A folha agrupa por data de pagamento, não por dia trabalhado: a semana de
 * 27/07 a 01/08 é paga no sábado 01/08 e por isso entra inteira na folha de
 * agosto, mesmo com cinco dias de julho. É assim que o pagamento acontece de
 * verdade — uma semana, um valor — e é o que evita a mesma semana virar dois
 * pagamentos na virada do mês.
 *
 * A semana vai de segunda a sábado, então domingo nunca entra por construção.
 * Saem também a folga fixa, as ausências registradas e o que estiver fora do
 * vínculo (antes da admissão ou depois do desligamento).
 */
export function semanasPagasNaCompetencia({
  ausencias,
  folgaSemanal,
  competencia,
  diaPagamento,
  desde,
  ate,
}: SemanasParams): SemanaPaga[] {
  const fora = new Set<string>()
  for (const ausencia of ausencias) {
    const total = diasDeAusencia(ausencia.dataInicio, ausencia.dataFim)
    for (let i = 0; i < total; i++) {
      fora.add(somarDiasISO(ausencia.dataInicio, i))
    }
  }

  // Uma semana paga na competência pode ter começado até duas semanas antes
  // do mês (6 dias de semana + até 7 de espera pelo dia de pagamento).
  const primeiraSegunda = segundaDaSemana(
    somarDiasISO(primeiroDiaDoMes(competencia), -14)
  )
  const ultimaSegunda = segundaDaSemana(
    somarDiasISO(ultimoDiaDoMes(competencia), 14)
  )

  const semanas: SemanaPaga[] = []

  for (
    let segunda = primeiraSegunda;
    segunda <= ultimaSegunda;
    segunda = somarDiasISO(segunda, 7)
  ) {
    const sabado = somarDiasISO(segunda, 5)
    const vencimento = vencimentoDaSemana(sabado, diaPagamento)
    if (vencimento.slice(0, 7) !== competencia) continue

    let diarias = 0
    for (let i = 0; i < 6; i++) {
      const dia = somarDiasISO(segunda, i)
      if (desde && dia < desde) continue
      if (ate && dia > ate) continue
      if (fora.has(dia)) continue
      if (folgaSemanal != null && diaDaSemana(dia) === folgaSemanal) continue
      diarias++
    }

    if (diarias > 0) {
      semanas.push({ inicio: segunda, fim: sabado, diarias, vencimento })
    }
  }

  return semanas
}

export function agruparAusenciasPorTipo<T extends { tipo: AusenciaTipo }>(
  ausencias: readonly T[]
): { tipo: AusenciaTipo; quantidade: number }[] {
  const contagem = new Map<AusenciaTipo, number>()

  for (const ausencia of ausencias) {
    contagem.set(ausencia.tipo, (contagem.get(ausencia.tipo) ?? 0) + 1)
  }

  return [...contagem.entries()]
    .map(([tipo, quantidade]) => ({ tipo, quantidade }))
    .sort((a, b) => b.quantidade - a.quantidade)
}
