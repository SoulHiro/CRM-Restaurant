export interface EmpresaCardapioInfo {
  id: string
  nome: string
  precoModo: 'por_tamanho' | 'unico'
  cardapioQtdAlternativas: number
}

export interface ColaboradorOption {
  id: string
  nome: string
}

export interface CardapioDiaPublicoPrato {
  id: string
  nome: string
}

export interface CardapioDiaPublico {
  data: string
  destaque: CardapioDiaPublicoPrato | null
  alternativas: CardapioDiaPublicoPrato[]
}

export interface RespostaExistente {
  data: string
  prato: string | null
  tamanho: 'P' | 'M' | 'G' | null
  recusou: boolean
}
