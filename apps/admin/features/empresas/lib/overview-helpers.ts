import type { EmpresaEnvio, EmpresaPausa } from './types'

export function percentChange(
  current: number,
  previous: number | undefined
): number | null {
  if (previous == null || previous === 0) return null
  return Math.round(((current - previous) / previous) * 100)
}

export function getEnviosPorDia(envios: EmpresaEnvio[]) {
  const contagem = new Map<string, number>()
  for (const envio of envios) {
    contagem.set(envio.data, (contagem.get(envio.data) ?? 0) + 1)
  }
  return Array.from(contagem.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([data, total]) => ({ data, total }))
}

export function getProximaPausa(pausas: EmpresaPausa[]) {
  const hoje = new Date().toISOString().slice(0, 10)
  return pausas
    .filter((pausa) => pausa.data >= hoje)
    .sort((a, b) => a.data.localeCompare(b.data))[0]
}
