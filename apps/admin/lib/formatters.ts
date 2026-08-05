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
