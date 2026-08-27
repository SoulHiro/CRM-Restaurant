/** % de variação de `atual` sobre `anterior` — null quando não há base de comparação. */
export function variacaoPercentual(
  atual: number,
  anterior: number
): number | null {
  if (anterior === 0) return atual === 0 ? 0 : null
  return Math.round(((atual - anterior) / anterior) * 100)
}

export interface PontoResumoPeriodo {
  label: string
  total: number
}

/**
 * Forma genérica de "quanto deu nesse período, quanto deu no anterior, e o
 * histórico" — usada tanto pela jornada (folha, dia 6 a dia 5) quanto pela
 * quinzena (recebimento de empresas, dia 1-15/16-fim), que têm calendários
 * diferentes mas o mesmo jeito de resumir tendência.
 */
export interface ResumoPeriodo {
  atual: number
  anterior: number
  variacao: number | null
  historico: PontoResumoPeriodo[]
}
