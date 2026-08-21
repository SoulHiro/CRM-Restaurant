export interface PratoCatalogoItem {
  id: string
  nome: string
  ativo: boolean
}

export interface CardapioDiaPrato {
  id: string
  nome: string
}

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
