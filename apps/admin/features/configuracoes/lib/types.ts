export type CampoComandaKey =
  | 'turno'
  | 'prato'
  | 'tamanho'
  | 'observacao'
  | 'empresa'
  | 'respondido_em'
  | 'impresso_em'

export const CAMPO_COMANDA_LABEL: Record<CampoComandaKey, string> = {
  turno: 'Turno (almoço/janta)',
  prato: 'Prato escolhido',
  tamanho: 'Tamanho da marmita',
  observacao: 'Observações',
  empresa: 'Nome da empresa',
  respondido_em: 'Data/hora da resposta no formulário',
  impresso_em: 'Data/hora da impressão',
}

/** Todas as chaves válidas, na ordem em que aparecem na lista de configuração. */
export const TODOS_CAMPOS_COMANDA: CampoComandaKey[] = [
  'turno',
  'prato',
  'tamanho',
  'observacao',
  'empresa',
  'respondido_em',
  'impresso_em',
]

/** O nome do colaborador nunca entra aqui — é sempre o topo fixo da comanda. */
export const CAMPOS_COMANDA_PADRAO: CampoComandaKey[] = [
  'turno',
  'prato',
  'tamanho',
  'observacao',
  'empresa',
]

export interface ConfiguracaoComanda {
  campos: CampoComandaKey[]
  impressoraId: string | null
}

export interface ImpressoraOption {
  id: string
  nome: string
}
