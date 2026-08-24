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

export interface ConfiguracaoPesagem {
  impressoraId: string | null
}

/**
 * Nome/endereço/CNPJ/IE não moram mais aqui — são fatos fixos, vivem em
 * `NEXT_PUBLIC_RESTAURANTE_*` (ver `lib/dados-restaurante.ts`). Só o que
 * pode mudar com alguma frequência (logo, cor de marca) continua no banco.
 */
export interface ConfiguracaoResumoDia {
  logoUrl: string
  corMarca: string
}

export type CampoResumoKey = 'nome' | 'endereco' | 'cnpj_ie'

export const CAMPO_RESUMO_LABEL: Record<CampoResumoKey, string> = {
  nome: 'Nome do estabelecimento',
  endereco: 'Endereço',
  cnpj_ie: 'CNPJ e Inscrição Estadual',
}

/** Todas as chaves válidas, na ordem em que aparecem na lista de configuração. */
export const TODOS_CAMPOS_RESUMO: CampoResumoKey[] = [
  'nome',
  'endereco',
  'cnpj_ie',
]

/** Todos ligados por padrão — é o layout que já existia antes de ser configurável. */
export const CAMPOS_RESUMO_PADRAO: CampoResumoKey[] = [
  'nome',
  'endereco',
  'cnpj_ie',
]

export interface ConfiguracaoLayoutResumo {
  campos: CampoResumoKey[]
}

/** Horários em texto 'HH:mm' — não são timestamp, são hora de todo dia. */
export interface ConfiguracaoHorarioFuncionamento {
  almocoInicio: string
  almocoFim: string
  jantaInicio: string
  jantaFim: string
  deliveryAbre: string
  deliveryFecha: string
  localAbre: string
  localFecha: string
}

export interface ConfiguracaoPrecificacao {
  custoOperacionalPorMinuto: number
  limiarAmareloPct: number
  limiarVerdePct: number
  limiarAzulPct: number
  limiarRoxoPct: number
}

export const HORARIO_FUNCIONAMENTO_PADRAO: ConfiguracaoHorarioFuncionamento = {
  almocoInicio: '11:00',
  almocoFim: '14:00',
  jantaInicio: '18:00',
  jantaFim: '22:00',
  deliveryAbre: '11:00',
  deliveryFecha: '22:00',
  localAbre: '11:00',
  localFecha: '22:00',
}

/** Mesmos números do default da coluna no banco — ver docs/rules e o schema. */
export const PRECIFICACAO_PADRAO: ConfiguracaoPrecificacao = {
  custoOperacionalPorMinuto: 0,
  limiarAmareloPct: 0,
  limiarVerdePct: 30,
  limiarAzulPct: 100,
  limiarRoxoPct: 200,
}
