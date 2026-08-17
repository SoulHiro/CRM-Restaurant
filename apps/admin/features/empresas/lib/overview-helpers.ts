import type { EmpresaPausa } from './types'

export function percentChange(
  current: number,
  previous: number | undefined
): number | null {
  if (previous == null || previous === 0) return null
  return Math.round(((current - previous) / previous) * 100)
}

export function getProximaPausa(pausas: EmpresaPausa[]) {
  const hoje = new Date().toISOString().slice(0, 10)
  return pausas
    .filter((pausa) => pausa.data >= hoje)
    .sort((a, b) => a.data.localeCompare(b.data))[0]
}
