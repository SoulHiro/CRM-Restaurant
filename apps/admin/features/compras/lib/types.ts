import type { Unidade } from '@/features/estoque/lib/types'
import type { DespesaSubtipo } from '@/features/financeiro/lib/types'

export const COMPRA_STATUS = [
  'pedido_feito',
  'aguardando_entrega',
  'recebido',
  'cancelado',
] as const
export type CompraStatus = (typeof COMPRA_STATUS)[number]

export const AVALIACAO_TIPOS = [
  'atraso',
  'qualidade',
  'produto_vencido',
  'outro',
] as const
export type AvaliacaoTipo = (typeof AVALIACAO_TIPOS)[number]

export interface CompraLinha {
  id: string
  estoqueItemId: string
  itemNome: string
  unidade: Unidade
  quantidade: number
  valorUnitario: number
  /** Derivado: quantidade × valor unitário. Nunca gravado. */
  total: number
}

export interface CompraListItem {
  id: string
  fornecedorId: string
  fornecedorNome: string
  numeroNotaFiscal: string | null
  categoriaDespesa: DespesaSubtipo
  status: CompraStatus
  dataPedido: string
  dataRecebimento: string | null
  total: number
  qtdItens: number
  /** Derivado: pedida, não recebida e já passou do prazo do fornecedor. */
  entregaAtrasada: boolean
}

/** A lista já traz as linhas: a linha-cartão expande sem uma segunda ida ao banco. */
export interface CompraNaLista extends CompraListItem {
  formaPagamento: string | null
  observacao: string | null
  linhas: CompraLinha[]
}

export interface CompraDetalhe extends CompraNaLista {
  criadoEm: string
  contaPagarId: string | null
  contaPagarPaga: boolean
}

export interface FornecedorListItem {
  id: string
  nome: string
  contato: string | null
  prazoEntregaDias: number | null
  prazoPagamento: string | null
  qtdItens: number
  qtdCompras: number
  /** `null` quando o fornecedor ainda não foi avaliado. */
  mediaAvaliacao: number | null
}

export interface FornecedorItemPreco {
  id: string
  fornecedorId: string
  fornecedorNome: string
  estoqueItemId: string
  itemNome: string
  unidade: Unidade
  preco: number
  prazoEntregaDias: number | null
  observacao: string | null
}

export interface AvaliacaoFornecedor {
  id: string
  data: string
  nota: number
  tipo: AvaliacaoTipo
  observacao: string | null
  responsavel: string | null
}

export interface FornecedorDetalhe extends FornecedorListItem {
  criadoEm: string
  itens: FornecedorItemPreco[]
  avaliacoes: AvaliacaoFornecedor[]
  compras: CompraListItem[]
}

export interface SugestaoItem {
  estoqueItemId: string
  nome: string
  unidade: Unidade
  tamanhoEmbalagem: number | null
  quantidadeAtual: number
  pontoReposicao: number
  /** Quanto falta para voltar ao ponto de reposição. */
  faltam: number
  ultimoPreco: number | null
  fornecedorId: string | null
  fornecedorNome: string | null
}

export interface SugestaoGrupo {
  fornecedorId: string | null
  fornecedorNome: string
  itens: SugestaoItem[]
  /** Soma de `faltam × último preço` — só das linhas com preço conhecido. */
  custoEstimado: number
}
