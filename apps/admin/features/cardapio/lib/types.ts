import type { CategoriaPrato } from './categoria-prato'

export interface PratoCatalogoItem {
  id: string
  nome: string
  ativo: boolean
  categoria: CategoriaPrato
}

export interface CardapioDiaPrato {
  id: string
  nome: string
  /** id de `cardapio_semana_dia_item` — precisa pra remover/reordenar/marcar destaque. */
  itemId: string
  /** Prato de custo mais alto — cobra o adicional "especial" (Valores) de quem escolher. */
  especial: boolean
  /** Fixado pra repetir todo [dia da semana] — ver `cardapio_prato_fixo`. */
  fixo: boolean
}

/**
 * `alternativas` já vem ordenado — é essa ordem que decide quem entra nas
 * "N primeiras" de cada empresa. `diaId` é nulo quando esse dia ainda não
 * tem nenhum item (linha de `cardapio_semana_dia` não existe até o primeiro
 * prato ser arrastado pra ele).
 */
export interface CardapioDiaItem {
  diaId: string | null
  data: string
  destaque: CardapioDiaPrato | null
  alternativas: CardapioDiaPrato[]
}

export interface CardapioDiaPropostoInput {
  data: string
  destaqueId: string
  alternativaIds: string[]
}

export interface ExtraEmpresaItem {
  id: string
  data: string
  prato: { id: string; nome: string }
}
