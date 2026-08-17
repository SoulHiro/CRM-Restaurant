const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const FUSO_RESTAURANTE = 'America/Sao_Paulo'

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: FUSO_RESTAURANTE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const shortDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: FUSO_RESTAURANTE,
  day: '2-digit',
  month: '2-digit',
})

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: FUSO_RESTAURANTE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

/** Colunas `date` do Postgres chegam assim: dia de calendário, sem hora. */
const DIA_DE_CALENDARIO = /^(\d{4})-(\d{2})-(\d{2})$/

const percentFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 1,
})

export function formatCurrencyBRL(value: number): string {
  return currencyFormatter.format(value)
}

/** Só o número, sem o símbolo — em pt-BR a casa decimal é vírgula. */
export function formatPercentBR(value: number): string {
  return percentFormatter.format(value)
}

/**
 * Dois tipos de data passam por aqui e cada um precisa de tratamento próprio:
 *
 * - **Dia de calendário** ('2026-11-08', de uma coluna `date`): não tem hora
 *   nem fuso. `new Date('2026-11-08')` é lido como meia-noite UTC e, formatado
 *   em Brasília (−3h), voltaria um dia — 08/11 viraria 07/11. Por isso é só
 *   reordenado como texto, sem `Date` nenhum no caminho.
 * - **Instante real** (timestamp de `created_at`): aí o fuso importa de
 *   verdade, e o correto é exibir no horário do restaurante.
 */
export function formatDateBR(value: string | Date): string {
  if (typeof value === 'string') {
    const dia = DIA_DE_CALENDARIO.exec(value)
    if (dia) return `${dia[3]}/${dia[2]}/${dia[1]}`
  }
  return dateFormatter.format(new Date(value))
}

/** Instante real com hora — carimbo de resposta, horário de impressão. */
export function formatDateTimeBR(value: string | Date): string {
  // Intl separa data e hora com vírgula ("10/08/2026, 11:32") — sem vírgula
  // fica mais limpo tanto na tela quanto impresso na comanda.
  return dateTimeFormatter.format(new Date(value)).replace(',', '')
}

export function formatShortDateBR(value: string | Date): string {
  if (typeof value === 'string') {
    const dia = DIA_DE_CALENDARIO.exec(value)
    if (dia) return `${dia[3]}/${dia[2]}`
  }
  return shortDateFormatter.format(new Date(value))
}

const isoDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/**
 * Um instante (timestamp) no dia de calendário do fuso do restaurante, em
 * 'YYYY-MM-DD'. O servidor roda em UTC na Vercel — usar `toISOString()`
 * viraria o dia às 21h de Brasília.
 */
export function dataISO(instante: Date): string {
  return isoDateFormatter.format(instante)
}

/** Data de hoje no fuso do restaurante, em 'YYYY-MM-DD'. */
export function hojeISO(): string {
  return dataISO(new Date())
}
