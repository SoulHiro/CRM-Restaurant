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

export type TipoDesconto = 'percentual' | 'valorFixo'

/**
 * Um desconto só por produto, aplicado igual em cada tamanho quando o
 * produto tem tamanhos — 'percentual' tira uma fração do preço, 'valorFixo'
 * tira um valor em R$ fixo (nunca deixa o preço negativo).
 */
export function calcularPrecoComDesconto(
  precoVenda: number,
  descontoTipo: TipoDesconto,
  descontoValor: number | null
): number {
  if (descontoValor == null || descontoValor <= 0) return precoVenda
  const precoFinal =
    descontoTipo === 'percentual'
      ? precoVenda * (1 - descontoValor / 100)
      : precoVenda - descontoValor
  return Math.max(0, precoFinal)
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
