/**
 * Colunas `numeric` do Postgres chegam como string pelo driver. A conversão
 * acontece só na camada de `queries.ts` de cada feature — nenhum componente
 * recebe número em formato de string.
 */
export function toNumber(value: string | null | undefined): number {
  if (value == null) return 0
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

/** Para colunas de quantidade — numeric(12,3), como no estoque. */
export function toNumericString(value: number): string {
  return (Math.round(value * 1000) / 1000).toFixed(3)
}

/** Para colunas de dinheiro — numeric(12,2). */
export function toMoneyString(value: number): string {
  return (Math.round(value * 100) / 100).toFixed(2)
}

/** Arredonda para 2 casas, evitando resíduo de float em soma de dinheiro. */
export function arredondarMoeda(value: number): number {
  return Math.round(value * 100) / 100
}
