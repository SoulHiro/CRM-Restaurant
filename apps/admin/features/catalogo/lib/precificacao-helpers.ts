export interface ItemFichaTecnicaCusto {
  quantidade: number
  custoUnitario: number
}

/** Soma quantidade × custo unitário de cada linha da ficha técnica. */
export function calcularCustoInsumos(
  itens: readonly ItemFichaTecnicaCusto[]
): number {
  return itens.reduce(
    (soma, item) => soma + item.quantidade * item.custoUnitario,
    0
  )
}

/**
 * Custo de insumos + custo operacional (gás/energia/mão de obra, resumidos
 * num único "custo por minuto" configurável) proporcional ao tempo médio de
 * preparo do prato.
 */
export function calcularCustoProducao(
  custoInsumos: number,
  tempoPreparoMinutos: number,
  custoOperacionalPorMinuto: number
): number {
  return custoInsumos + tempoPreparoMinutos * custoOperacionalPorMinuto
}

export interface FaixasPreco {
  /** Só cobre a despesa — 0% de margem. Vender abaixo disso é prejuízo. */
  minimoSobrevivencia: number
  minimoRecomendado: number
  maximoRecomendado: number
}

export interface MargensRecomendadas {
  /** % de margem sobre o custo de produção. */
  minimaPct: number
  maximaPct: number
}

export function calcularFaixasPreco(
  custoProducao: number,
  margens: MargensRecomendadas
): FaixasPreco {
  return {
    minimoSobrevivencia: custoProducao,
    minimoRecomendado: custoProducao * (1 + margens.minimaPct / 100),
    maximoRecomendado: custoProducao * (1 + margens.maximaPct / 100),
  }
}

export type CorMargem = 'vermelho' | 'amarelo' | 'verde' | 'azul' | 'roxo'

export interface LimiaresMargem {
  amareloPct: number
  verdePct: number
  azulPct: number
  roxoPct: number
}

/**
 * Margem = quanto o preço de venda excede o custo de produção, em %. Cor
 * conforme os limiares configurados em `configuracao_precificacao`
 * (vermelho = prejuízo/sem margem, roxo = lucro tão alto que pode afastar
 * cliente). `custoProducao` zero é tratado como "sem dado" — cai em
 * vermelho, não divide por zero.
 */
export function calcularMargemPercentual(
  precoVenda: number,
  custoProducao: number
): number {
  if (custoProducao <= 0) return 0
  return ((precoVenda - custoProducao) / custoProducao) * 100
}

export function corMargem(
  margemPercentual: number,
  limiares: LimiaresMargem
): CorMargem {
  if (margemPercentual <= limiares.amareloPct) return 'vermelho'
  if (margemPercentual <= limiares.verdePct) return 'amarelo'
  if (margemPercentual <= limiares.azulPct) return 'verde'
  if (margemPercentual <= limiares.roxoPct) return 'azul'
  return 'roxo'
}

/** Classes Tailwind semânticas (com par dark:) — mesmo padrão de TrendBadge, sem hex cru. */
export const COR_MARGEM_CLASSE: Record<CorMargem, string> = {
  vermelho: 'text-red-600 dark:text-red-400',
  amarelo: 'text-amber-600 dark:text-amber-400',
  verde: 'text-emerald-600 dark:text-emerald-400',
  azul: 'text-blue-600 dark:text-blue-400',
  roxo: 'text-purple-600 dark:text-purple-400',
}

export const COR_MARGEM_LABEL: Record<CorMargem, string> = {
  vermelho: 'Prejuízo',
  amarelo: 'Margem baixa',
  verde: 'Margem saudável',
  azul: 'Margem alta',
  roxo: 'Margem excessiva',
}
