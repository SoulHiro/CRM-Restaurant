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
 * Nunca é digitado — sempre derivado do peso. A ficha técnica principal
 * representa o peso do tamanho-base; os outros escalam por essa razão.
 */
export function multiplicadorPorPeso(
  pesoGramas: number,
  pesoBaseGramas: number
): number {
  if (pesoBaseGramas <= 0) return 1
  return pesoGramas / pesoBaseGramas
}

export interface ItemFichaTecnicaCustoTamanho extends ItemFichaTecnicaCusto {
  tipoEscala: 'proporcional' | 'fixo'
  /** Override 'fixo' já resolvido pro tamanho em questão — undefined = linha proporcional. */
  quantidadeFixaTamanho?: number
}

/**
 * Mesmo cálculo de `calcularCustoInsumos`, mas por tamanho: linha
 * `proporcional` usa `quantidade × multiplicador`; linha `fixo` usa a
 * quantidade própria daquele tamanho (embalagem, tempero fixo), ignorando o
 * multiplicador — uma marmita G não leva "1,5 embalagem".
 */
export function calcularCustoInsumosTamanho(
  itens: readonly ItemFichaTecnicaCustoTamanho[],
  multiplicador: number
): number {
  return itens.reduce((soma, item) => {
    const quantidade =
      item.tipoEscala === 'fixo' && item.quantidadeFixaTamanho != null
        ? item.quantidadeFixaTamanho
        : item.quantidade * multiplicador
    return soma + quantidade * item.custoUnitario
  }, 0)
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

/**
 * Food cost % — quanto do preço de venda é consumido pelo custo de produção
 * (o inverso da margem, mesma matemática só que na leitura que dono de
 * restaurante/contador já reconhece de cabeça: ~28-35% é saudável, acima
 * disso é alerta). `precoVenda` zero é "sem dado", não divisão por zero.
 */
export function calcularFoodCostPercentual(
  precoVenda: number,
  custoProducao: number
): number {
  if (precoVenda <= 0) return 0
  return (custoProducao / precoVenda) * 100
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
