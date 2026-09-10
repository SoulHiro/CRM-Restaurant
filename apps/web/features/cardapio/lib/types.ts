export type EmpresaFluxoPedido = 'padrao' | 'pesagem'

export type TurnoRefeicao =
  | 'almoco'
  | 'jantar'
  | '1_turno'
  | '2_turno'
  | '3_turno'
  | 'administrativo'

export interface EmpresaCardapioInfo {
  id: string
  nome: string
  precoModo: 'por_tamanho' | 'unico'
  cardapioQtdAlternativas: number
  fluxoPedido: EmpresaFluxoPedido
  /** Aviso de contrato específico da empresa (ex: LNR) — nulo = não mostra nada. */
  avisoCardapio: string | null
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
  observacao: string | null
  recusou: boolean
}

/** Um intervalo segunda-sábado dentro do mês corrente, pro seletor de semana. */
export interface SemanaOption {
  inicio: string
  fim: string
  /** "Semana atual", "13 a 18/10", etc. */
  label: string
}
