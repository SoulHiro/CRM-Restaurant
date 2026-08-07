import type { InventarioLinha } from './types'

/**
 * Positivo = sobrou no físico em relação ao sistema; negativo = faltou.
 * Arredondado em 3 casas porque a coluna é numeric(12,3) — sem isso, uma
 * subtração de float deixa resíduo (0.1 - 0.3 = -0.19999...) e uma contagem
 * exata apareceria como divergente.
 */
export function calcularDiferenca(
  quantidadeContada: number,
  quantidadeSistema: number
): number {
  return Math.round((quantidadeContada - quantidadeSistema) * 1000) / 1000
}

export interface ResumoContagem {
  totalLinhas: number
  linhasContadas: number
  linhasPendentes: number
  linhasDivergentes: number
  sobra: number
  falta: number
  completo: boolean
}

export function resumirContagem(linhas: InventarioLinha[]): ResumoContagem {
  const contadas = linhas.filter((linha) => linha.quantidadeContada != null)
  const divergentes = contadas.filter((linha) => (linha.diferenca ?? 0) !== 0)

  const sobra = divergentes
    .filter((linha) => (linha.diferenca ?? 0) > 0)
    .reduce((soma, linha) => soma + (linha.diferenca ?? 0), 0)

  const falta = divergentes
    .filter((linha) => (linha.diferenca ?? 0) < 0)
    .reduce((soma, linha) => soma + Math.abs(linha.diferenca ?? 0), 0)

  return {
    totalLinhas: linhas.length,
    linhasContadas: contadas.length,
    linhasPendentes: linhas.length - contadas.length,
    linhasDivergentes: divergentes.length,
    sobra: Math.round(sobra * 1000) / 1000,
    falta: Math.round(falta * 1000) / 1000,
    completo: linhas.length > 0 && contadas.length === linhas.length,
  }
}

export function linhasParaAjustar(
  linhas: InventarioLinha[]
): InventarioLinha[] {
  return linhas.filter(
    (linha) => linha.quantidadeContada != null && (linha.diferenca ?? 0) !== 0
  )
}
