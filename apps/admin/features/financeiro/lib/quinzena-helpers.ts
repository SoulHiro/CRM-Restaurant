import { variacaoPercentual, type ResumoPeriodo } from './resumo-periodo-helpers'

/**
 * As empresas B2B pagam quinzenal, num calendário próprio (não é a jornada
 * de folha, dia 6-5): quinzena 1 é dia 1-15, quinzena 2 é dia 16 até o
 * último dia do mês. A nota fiscal sai no último dia de cada quinzena, e o
 * prazo de pagamento é sempre a próxima quarta-feira a partir dali — por
 * isso `dataPagamento` é uma data móvel, não um dia fixo do mês.
 */
export interface Quinzena {
  numero: 1 | 2
  ano: number
  mes: number
  /** Ambos inclusive — diferente de `Jornada`, cujo `fim` é exclusivo. */
  inicio: string
  fim: string
  dataEmissao: string
  dataPagamento: string
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function ultimoDiaDoMes(ano: number, mes: number): number {
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate()
}

/** Menor data >= `dataISO` que cai numa quarta-feira (0=domingo...3=quarta). */
function proximaQuartaFeira(dataISO: string): string {
  const data = new Date(`${dataISO}T00:00:00Z`)
  const diasAteQuarta = (3 - data.getUTCDay() + 7) % 7
  data.setUTCDate(data.getUTCDate() + diasAteQuarta)
  return data.toISOString().slice(0, 10)
}

export function quinzenaDe(ano: number, mes: number, numero: 1 | 2): Quinzena {
  const inicio = numero === 1 ? `${ano}-${pad(mes)}-01` : `${ano}-${pad(mes)}-16`
  const fimDia = numero === 1 ? 15 : ultimoDiaDoMes(ano, mes)
  const fim = `${ano}-${pad(mes)}-${pad(fimDia)}`
  return {
    numero,
    ano,
    mes,
    inicio,
    fim,
    dataEmissao: fim,
    dataPagamento: proximaQuartaFeira(fim),
  }
}

export function quinzenaAnterior(quinzena: Quinzena): Quinzena {
  if (quinzena.numero === 2) return quinzenaDe(quinzena.ano, quinzena.mes, 1)
  const mes = quinzena.mes === 1 ? 12 : quinzena.mes - 1
  const ano = quinzena.mes === 1 ? quinzena.ano - 1 : quinzena.ano
  return quinzenaDe(ano, mes, 2)
}

export function quinzenaSeguinte(quinzena: Quinzena): Quinzena {
  if (quinzena.numero === 1) return quinzenaDe(quinzena.ano, quinzena.mes, 2)
  const mes = quinzena.mes === 12 ? 1 : quinzena.mes + 1
  const ano = quinzena.mes === 12 ? quinzena.ano + 1 : quinzena.ano
  return quinzenaDe(ano, mes, 1)
}

/** A quinzena mais recente já fechada/faturada (emissão <= hoje) — não a que ainda está acumulando pedido. */
export function quinzenaAtual(hoje: string): Quinzena {
  const [ano, mes, dia] = hoje.slice(0, 10).split('-').map(Number)
  if (!ano || !mes || !dia) return quinzenaDe(1970, 1, 1)

  const ultimoDia = ultimoDiaDoMes(ano, mes)
  if (dia >= ultimoDia) return quinzenaDe(ano, mes, 2)
  if (dia >= 15) return quinzenaDe(ano, mes, 1)

  const mesAnterior = mes === 1 ? 12 : mes - 1
  const anoAnterior = mes === 1 ? ano - 1 : ano
  return quinzenaDe(anoAnterior, mesAnterior, 2)
}

/** Chave estável pra URL: "2026-08-1" — evita depender de `inicio`/`fim` como identidade. */
export function quinzenaParaChave(quinzena: Quinzena): string {
  return `${quinzena.ano}-${pad(quinzena.mes)}-${quinzena.numero}`
}

export function quinzenaDeChave(chave: string): Quinzena | null {
  const match = /^(\d{4})-(\d{2})-([12])$/.exec(chave)
  if (!match) return null
  const [, anoStr, mesStr, numeroStr] = match
  return quinzenaDe(Number(anoStr), Number(mesStr), Number(numeroStr) as 1 | 2)
}

const FORMATADOR_CURTO = new Intl.DateTimeFormat('pt-BR', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
})
const FORMATADOR_DIA_SEMANA = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
})

/** "1 ago – 15 ago" */
export function formatQuinzena(quinzena: Quinzena): string {
  const inicio = new Date(`${quinzena.inicio}T00:00:00Z`)
  const fim = new Date(`${quinzena.fim}T00:00:00Z`)
  return `${FORMATADOR_CURTO.format(inicio)} – ${FORMATADOR_CURTO.format(fim)}`
}

/** "qua., 19 de ago." — a data móvel de pagamento, não um dia fixo. */
export function formatDataPagamento(quinzena: Quinzena): string {
  return FORMATADOR_DIA_SEMANA.format(new Date(`${quinzena.dataPagamento}T00:00:00Z`))
}

export function filtrarContasPorQuinzena<T extends { dataVencimento: string }>(
  contas: T[],
  quinzena: Quinzena
): T[] {
  return contas.filter(
    (conta) =>
      conta.dataVencimento >= quinzena.inicio &&
      conta.dataVencimento <= quinzena.fim
  )
}

export function totalPorQuinzena<
  T extends { dataVencimento: string; valor: number },
>(contas: T[], quinzena: Quinzena): number {
  return filtrarContasPorQuinzena(contas, quinzena).reduce(
    (soma, conta) => soma + conta.valor,
    0
  )
}

export function resumoQuinzenaFinanceiro<
  T extends { dataVencimento: string; valor: number },
>(contas: T[], quinzena: Quinzena, quantidadeHistorico = 6): ResumoPeriodo {
  const sequencia: Quinzena[] = []
  let cursor = quinzena
  for (let i = 0; i < quantidadeHistorico; i++) {
    sequencia.unshift(cursor)
    cursor = quinzenaAnterior(cursor)
  }

  const historico = sequencia.map((q) => ({
    label: FORMATADOR_CURTO.format(new Date(`${q.fim}T00:00:00Z`)),
    total: totalPorQuinzena(contas, q),
  }))

  const atual = historico[historico.length - 1]?.total ?? 0
  const anterior = historico[historico.length - 2]?.total ?? 0

  return { atual, anterior, variacao: variacaoPercentual(atual, anterior), historico }
}
