import { formatCurrencyBRL } from '@/lib/formatters'

/**
 * Único ponto do projeto que faz matemática de dinheiro em centavos
 * inteiros — comanda com pagamento parcial/misto/troco/divisão precisa de
 * exatidão total, e o resto do sistema usa `numeric`/float
 * (`lib/numeric.ts`) porque não lida com troco. Conversão pra `numeric` só
 * acontece na borda, ao gravar em `transacao_financeira`.
 */
export function reaisParaCentavos(valor: number): number {
  return Math.round(valor * 100)
}

export function centavosParaReais(centavos: number): number {
  return centavos / 100
}

export function formatarCentavosBRL(centavos: number): string {
  return formatCurrencyBRL(centavosParaReais(centavos))
}

/**
 * Divide um total em `partes` linhas iguais sem perder nem sobrar 1
 * centavo — o resto da divisão inteira vai todo pra primeira linha (ex:
 * R$100,00 ÷ 3 = [33,34, 33,33, 33,33], nunca 33,33×3 = R$99,99).
 */
export function dividirCentavosIgualmente(
  totalCentavos: number,
  partes: number
): number[] {
  if (partes <= 0) return []
  const base = Math.floor(totalCentavos / partes)
  const resto = totalCentavos - base * partes
  return Array.from({ length: partes }, (_, i) => base + (i === 0 ? resto : 0))
}

export function somarCentavos(valores: readonly number[]): number {
  return valores.reduce((soma, valor) => soma + valor, 0)
}

/** Aceita "45,00", "45.00" ou "45" digitado num input — inválido vira 0. */
export function parseReaisParaCentavos(texto: string): number {
  const normalizado = texto.trim().replace(',', '.')
  const valor = Number(normalizado)
  if (!Number.isFinite(valor) || valor < 0) return 0
  return reaisParaCentavos(valor)
}
