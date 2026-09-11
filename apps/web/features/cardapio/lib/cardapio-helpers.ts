import type { CardapioDiaPublico, CardapioDiaPublicoPrato } from './types'

/**
 * Soma os extras exclusivos da empresa às alternativas do dia — sempre por
 * cima do corte de `cardapioQtdAlternativas`, nunca substituindo nada.
 */
export function mesclarExtras(
  cardapio: CardapioDiaPublico[],
  extras: { data: string; prato: CardapioDiaPublicoPrato }[]
): CardapioDiaPublico[] {
  const extrasPorDia = new Map<string, CardapioDiaPublicoPrato[]>()
  for (const extra of extras) {
    const atual = extrasPorDia.get(extra.data) ?? []
    atual.push(extra.prato)
    extrasPorDia.set(extra.data, atual)
  }

  return cardapio.map((dia) => ({
    ...dia,
    alternativas: [...dia.alternativas, ...(extrasPorDia.get(dia.data) ?? [])],
  }))
}
