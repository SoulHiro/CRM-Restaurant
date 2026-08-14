export const UNIDADES = ['un', 'kg', 'g', 'l', 'ml', 'cx', 'pct'] as const
export type Unidade = (typeof UNIDADES)[number]

export const MOVIMENTO_TIPOS = [
  'entrada_compra',
  'perda',
  'ajuste_inventario',
  'baixa_venda',
  'ajuste_manual',
] as const
export type MovimentoTipo = (typeof MOVIMENTO_TIPOS)[number]

export const PERDA_MOTIVOS = [
  'vencido',
  'quebra',
  'erro_preparo',
  'outro',
] as const
export type PerdaMotivo = (typeof PERDA_MOTIVOS)[number]

export type InventarioStatus = 'em_andamento' | 'finalizado'

export type NivelEstoque = 'zerado' | 'baixo' | 'ok'

export interface EstoqueItem {
  id: string
  nome: string
  unidade: Unidade
  quantidadeAtual: number
  pontoReposicao: number
  tamanhoEmbalagem: number | null
  validade: string | null
  fornecedorPadraoId: string | null
  fornecedorPadraoNome: string | null
  ativo: boolean
  criadoEm: string
}

/** Item da lista, com o último preço pago — null quando nunca foi comprado. */
export interface EstoqueListItem extends EstoqueItem {
  precoAtual: number | null
}

export interface EstoqueMovimento {
  id: string
  tipo: MovimentoTipo
  quantidade: number
  quantidadeResultante: number
  observacao: string | null
  responsavel: string | null
  criadoEm: string
}

export interface PerdaEstoque {
  id: string
  itemId: string
  itemNome: string
  unidade: Unidade
  quantidade: number
  motivo: PerdaMotivo
  data: string
  responsavel: string
  observacao: string | null
}

export interface PrecoInsumo {
  id: string
  preco: number
  dataVigencia: string
  fornecedorNome: string | null
}

export interface EstoqueItemDetalhe {
  item: EstoqueItem
  movimentos: EstoqueMovimento[]
  perdas: PerdaEstoque[]
  precos: PrecoInsumo[]
}

export interface AlertaEstoqueBaixo {
  itemId: string
  nome: string
  unidade: Unidade
  quantidadeAtual: number
  pontoReposicao: number
  nivel: Exclude<NivelEstoque, 'ok'>
}

export interface AlertaVencimento {
  itemId: string
  nome: string
  unidade: Unidade
  quantidadeAtual: number
  validade: string
  diasRestantes: number
}

export interface AlertasEstoque {
  estoqueBaixo: AlertaEstoqueBaixo[]
  vencimentoProximo: AlertaVencimento[]
}

export interface InventarioResumo {
  id: string
  data: string
  responsavel: string
  status: InventarioStatus
  observacao: string | null
  totalLinhas: number
  linhasContadas: number
  linhasDivergentes: number
  finalizadoEm: string | null
}

export interface InventarioLinha {
  id: string
  itemId: string
  itemNome: string
  unidade: Unidade
  quantidadeSistema: number
  quantidadeContada: number | null
  diferenca: number | null
}

export interface InventarioDetalhe {
  resumo: InventarioResumo
  linhas: InventarioLinha[]
}
