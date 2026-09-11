export interface PratoCatalogoItem {
  id: string
  nome: string
  ativo: boolean
}

export interface CardapioDiaPrato {
  id: string
  nome: string
}

/** `alternativas` já vem ordenado — é essa ordem que decide quem entra nas "N primeiras" de cada empresa. */
export interface CardapioDiaItem {
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
  prato: CardapioDiaPrato
}
