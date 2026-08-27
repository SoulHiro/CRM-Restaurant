import { variacaoPercentual, type ResumoPeriodo } from './resumo-periodo-helpers'

/**
 * "Jornada" é o ciclo de pagamento real da casa — dia 6 até dia 5 do mês
 * seguinte (não é o mês de calendário) — porque adiantamento sai no dia 20
 * e o restante do salário só no dia 5 do mês seguinte; usar mês de
 * calendário misturava a jornada atual com a próxima. `fim` é sempre
 * exclusivo: o dia 6 já pertence à jornada seguinte, o dia 5 é o último
 * dia desta.
 */
export interface Jornada {
  inicio: string
  fim: string
}

const DIA_CORTE = 6

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** Soma (ou subtrai) meses a uma data ISO, mantendo o dia. */
function somarMeses(dataISO: string, delta: number): string {
  const [ano, mes, dia] = dataISO.slice(0, 10).split('-').map(Number)
  if (!ano || !mes || !dia) return dataISO
  const totalMeses = ano * 12 + (mes - 1) + delta
  const anoNovo = Math.floor(totalMeses / 12)
  const mesNovo = (totalMeses % 12) + 1
  return `${anoNovo}-${pad(mesNovo)}-${pad(dia)}`
}

export function jornadaDe(dataISO: string): Jornada {
  const dia = Number(dataISO.slice(8, 10))
  const diaCorteDoMes = `${dataISO.slice(0, 7)}-${pad(DIA_CORTE)}`
  const inicio = dia < DIA_CORTE ? somarMeses(diaCorteDoMes, -1) : diaCorteDoMes
  return { inicio, fim: somarMeses(inicio, 1) }
}

/**
 * Força o dia de um `inicio` de jornada pra `DIA_CORTE` — necessário porque
 * `?jornada=` na URL pode ter sido salvo antes do corte mudar de dia (era
 * dia 5, virou dia 6); sem isso, `jornadaAnterior`/`jornadaSeguinte` ficam
 * presos no dia antigo pra sempre, já que só somam/subtraem mês mantendo o
 * dia que já está lá.
 */
export function normalizarJornadaInicio(inicio: string): string {
  return `${inicio.slice(0, 7)}-${pad(DIA_CORTE)}`
}

export function jornadaAnterior(inicio: string): string {
  return somarMeses(inicio, -1)
}

export function jornadaSeguinte(inicio: string): string {
  return somarMeses(inicio, 1)
}

// `timeZone: 'UTC'` é obrigatório aqui — sem isso, meia-noite UTC vira o dia
// anterior em fuso negativo (Brasília), voltando um dia igual ao bug já
// documentado em `lib/formatters.ts`.
const FORMATADOR_CURTO = new Intl.DateTimeFormat('pt-BR', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
})
const FORMATADOR_COMPLETO = new Intl.DateTimeFormat('pt-BR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

/** "5 ago – 4 set de 2026" — mostra o fim como o último dia dentro da jornada, não a data de corte (exclusiva). */
export function formatJornada({ inicio, fim }: Jornada): string {
  const dataInicio = new Date(`${inicio}T00:00:00Z`)
  const ultimoDia = new Date(new Date(`${fim}T00:00:00Z`).getTime() - 86_400_000)
  return `${FORMATADOR_CURTO.format(dataInicio)} – ${FORMATADOR_COMPLETO.format(ultimoDia)}`
}

export function filtrarContasPorJornada<T extends { dataVencimento: string }>(
  contas: T[],
  jornada: Jornada
): T[] {
  return contas.filter(
    (conta) =>
      conta.dataVencimento >= jornada.inicio &&
      conta.dataVencimento < jornada.fim
  )
}

export function totalPorJornada<
  T extends { dataVencimento: string; valor: number },
>(contas: T[], jornada: Jornada): number {
  return filtrarContasPorJornada(contas, jornada).reduce(
    (soma, conta) => soma + conta.valor,
    0
  )
}

/** As últimas N jornadas terminando na `inicioAtual`, mais antiga primeiro — para gráfico de tendência. */
export function ultimasJornadas(inicioAtual: string, quantidade: number): string[] {
  const lista: string[] = []
  let cursor = inicioAtual
  for (let i = 0; i < quantidade; i++) {
    lista.unshift(cursor)
    cursor = jornadaAnterior(cursor)
  }
  return lista
}

// `timeZone: 'UTC'` pelo mesmo motivo do `FORMATADOR_CURTO` acima.
const FORMATADOR_EIXO = new Intl.DateTimeFormat('pt-BR', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
})

/** Total da jornada atual + variação vs a anterior + histórico das últimas N, pra alimentar o gráfico de tendência. */
export function resumoJornadaFinanceiro<
  T extends { dataVencimento: string; valor: number },
>(
  contas: T[],
  jornadaInicio: string,
  quantidadeHistorico = 6
): ResumoPeriodo {
  const jornadas = ultimasJornadas(jornadaInicio, quantidadeHistorico)
  const historico = jornadas.map((inicio) => ({
    label: FORMATADOR_EIXO.format(new Date(`${inicio}T00:00:00Z`)),
    total: totalPorJornada(contas, { inicio, fim: jornadaSeguinte(inicio) }),
  }))

  const atual = historico[historico.length - 1]?.total ?? 0
  const anterior = historico[historico.length - 2]?.total ?? 0

  return { atual, anterior, variacao: variacaoPercentual(atual, anterior), historico }
}
