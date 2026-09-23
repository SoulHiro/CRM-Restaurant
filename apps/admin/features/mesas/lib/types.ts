export const COMANDA_STATUS = ['aberta', 'fechada', 'cancelada'] as const
export type ComandaStatus = (typeof COMANDA_STATUS)[number]

export const FORMAS_PAGAMENTO = ['credito', 'debito', 'pix', 'dinheiro'] as const
export type FormaPagamento = (typeof FORMAS_PAGAMENTO)[number]

export const FORMA_PAGAMENTO_LABEL: Record<FormaPagamento, string> = {
  credito: 'Crédito',
  debito: 'Débito',
  pix: 'Pix',
  dinheiro: 'Dinheiro',
}

/** Produto pronto pra lançamento em comanda — versão enxuta de `ProdutoListItem`. */
export interface ProdutoLancamento {
  id: string
  nome: string
  categoriaNome: string | null
  codigoRapido: number | null
  temTamanhos: boolean
  /** Centavos — null quando `temTamanhos` (usar `tamanhos`). */
  precoVendaCentavos: number | null
  tamanhos: { id: string; nome: string; precoVendaCentavos: number }[]
}

export interface ComandaItemView {
  id: string
  produtoId: string
  produtoNome: string
  produtoTamanhoId: string | null
  produtoTamanhoNome: string | null
  quantidade: number
  precoUnitarioCentavos: number
  totalCentavos: number
  observacao: string | null
  enviadoCozinha: boolean
  criadoEm: string
}

export interface ComandaPagamentoView {
  id: string
  forma: FormaPagamento
  valorCentavos: number
  criadoEm: string
}

export interface ComandaView {
  id: string
  numero: number
  data: string
  mesaLabel: string | null
  status: ComandaStatus
  abertoPorNome: string
  abertoEm: string
  fechadoEm: string | null
  notaPendente: boolean
  clienteEmail: string | null
  observacao: string | null
  itens: ComandaItemView[]
  pagamentos: ComandaPagamentoView[]
  totalCentavos: number
  pagoCentavos: number
  saldoDevidoCentavos: number
}

export interface ConfiguracaoSalao {
  quantidadeComandas: number
}
