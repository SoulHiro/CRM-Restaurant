export const TRANSACAO_TIPOS = ['receita', 'despesa'] as const
export type TransacaoTipo = (typeof TRANSACAO_TIPOS)[number]

export const TRANSACAO_ORIGENS = [
  'manual',
  'anotai',
  'ifood',
  'pagbank',
  'marmita_b2b',
] as const
export type TransacaoOrigem = (typeof TRANSACAO_ORIGENS)[number]

export const DESPESA_CATEGORIAS = ['fixa', 'variavel'] as const
export type DespesaCategoria = (typeof DESPESA_CATEGORIAS)[number]

export const DESPESA_SUBTIPOS = [
  'aluguel',
  'salario',
  'vale_transporte',
  'imposto',
  'fornecedor',
  'insumo',
  'equipamento',
  'manutencao',
  'taxa_plataforma',
  'outro',
] as const
export type DespesaSubtipo = (typeof DESPESA_SUBTIPOS)[number]

export const META_TIPOS = ['financeira', 'operacional'] as const
export type MetaTipo = (typeof META_TIPOS)[number]

/** Guardado no banco. "atrasado" nunca é gravado — ver `StatusConta`. */
export type ContaStatus = 'pendente' | 'pago'

/** Exibido na tela: `atrasado` é derivado de pendente + vencimento passado. */
export type StatusConta = 'pendente' | 'pago' | 'atrasado'

export interface Transacao {
  id: string
  tipo: TransacaoTipo
  origem: TransacaoOrigem
  valor: number
  data: string
  descricao: string
  categoria: DespesaCategoria | null
  subtipo: DespesaSubtipo | null
  /** Preenchido quando a transação nasceu de uma conta paga/recebida. */
  origemTipo: string | null
  origemId: string | null
  responsavel: string | null
  criadoEm: string
}

export interface ContaPagar {
  id: string
  descricao: string
  categoria: DespesaCategoria
  subtipo: DespesaSubtipo
  valor: number
  dataVencimento: string
  status: ContaStatus
  dataPagamento: string | null
  observacao: string | null
  criadoEm: string
}

export interface ContaReceber {
  id: string
  empresaId: string | null
  empresaNome: string
  periodo: string
  valor: number
  dataVencimento: string
  status: ContaStatus
  dataPagamento: string | null
  observacao: string | null
  criadoEm: string
}

export interface Meta {
  id: string
  descricao: string
  tipo: MetaTipo
  valorAlvo: number | null
  inicio: string
  prazo: string
  ativa: boolean
}

export interface AjusteMeta {
  id: string
  data: string
  /** Delta: positivo em aporte, negativo em retirada. */
  valor: number
  observacao: string | null
  criadoEm: string
}

export interface DRE {
  receita: number
  despesa: number
  lucro: number
  despesaFixa: number
  despesaVariavel: number
  /** Quanto precisa faturar no mês só para cobrir os custos fixos. */
  pontoEquilibrio: number
  totalLancamentos: number
}

export interface FatiaOrigem {
  origem: TransacaoOrigem
  valor: number
  percentual: number
}

export interface FatiaSubtipo {
  subtipo: DespesaSubtipo
  valor: number
  percentual: number
}

export interface ResumoContas {
  pagarPendente: number
  pagarAtrasado: number
  pagarAtrasadoQtd: number
  receberPendente: number
  receberAtrasado: number
  receberAtrasadoQtd: number
}

export interface ProgressoMeta {
  meta: Meta
  /** Lucro acumulado no período da meta, direto do livro-razão. */
  lucroPeriodo: number
  /** Soma dos aportes/retiradas lançados à mão. */
  ajustes: number
  acumulado: number
  falta: number
  percentual: number
  diasRestantes: number
  semanasRestantes: number
  /** Quanto precisa entrar por semana daqui pra frente. */
  ritmoSemanal: number
  atingida: boolean
  vencida: boolean
}
