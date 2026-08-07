const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const shortDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
})

export function formatCurrencyBRL(value: number): string {
  return currencyFormatter.format(value)
}

export function formatDateBR(value: string | Date): string {
  return dateFormatter.format(new Date(value))
}

export function formatShortDateBR(value: string | Date): string {
  return shortDateFormatter.format(new Date(value))
}

const isoDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/**
 * Data de hoje no fuso do restaurante, em 'YYYY-MM-DD'. O servidor roda em UTC
 * na Vercel — usar `toISOString()` viraria o dia às 21h de Brasília.
 */
export function hojeISO(): string {
  return isoDateFormatter.format(new Date())
}
