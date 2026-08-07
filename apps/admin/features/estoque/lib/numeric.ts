/**
 * Colunas `numeric` do Postgres chegam como string pelo driver. A conversão
 * acontece só aqui e em `queries.ts` — nenhum componente recebe número em
 * formato de string.
 */
export function toNumber(value: string | null | undefined): number {
  if (value == null) return 0
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

/** numeric(12,3) — mais casas que isso o banco arredondaria silenciosamente. */
export function toNumericString(value: number): string {
  return (Math.round(value * 1000) / 1000).toFixed(3)
}
