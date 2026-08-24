import type { CategoriaEstoque, Unidade } from '@/features/estoque/lib/types'

export const TIPOS_PRODUTO = ['comida', 'bebida'] as const
export type TipoProduto = (typeof TIPOS_PRODUTO)[number]

export const TIPO_PRODUTO_LABEL: Record<TipoProduto, string> = {
  comida: 'Comida',
  bebida: 'Bebida',
}

export const DISPONIBILIDADE_STATUS = [
  'disponivel',
  'pausado',
  'personalizado',
] as const
export type DisponibilidadeStatus = (typeof DISPONIBILIDADE_STATUS)[number]

export const DISPONIBILIDADE_STATUS_LABEL: Record<
  DisponibilidadeStatus,
  string
> = {
  disponivel: 'Disponível',
  pausado: 'Pausado',
  personalizado: 'Horário personalizado',
}

export const APLICA_A = ['comida', 'bebida', 'ambos'] as const
export type AplicaA = (typeof APLICA_A)[number]

export interface CategoriaProdutoOption {
  id: string
  nome: string
}

export interface ClassificacaoOption {
  id: string
  nome: string
  aplicaA: AplicaA
}

export interface AdicionalOption {
  id: string
  nome: string
  preco: number
  ativo: boolean
}

/** Insumo elegível pra ficha técnica — só comestível/preparo/embalagem entram. */
export interface InsumoOption {
  id: string
  nome: string
  unidade: Unidade
  categoria: CategoriaEstoque
  custoUnitario: number
}

export interface FichaTecnicaItemInput {
  estoqueItemId: string
  nome: string
  unidade: Unidade
  quantidade: number
  custoUnitario: number
}

export interface DisponibilidadeJanelaInput {
  diaSemana: number
  horaInicio: string
  horaFim: string
}

export interface CriarProdutoInput {
  nome: string
  categoriaId: string | null
  tipo: TipoProduto
  descricao: string
  fotoUrl: string
  videoUrl: string
  fichaTecnica: FichaTecnicaItemInput[]
  tempoMedioPreparoMinutos: number
  precoVenda: number
  descontoPercentual: number | null
  disponivelDelivery: boolean
  disponivelLocal: boolean
  disponibilidadeStatus: DisponibilidadeStatus
  apareceAlmoco: boolean
  apareceJanta: boolean
  janelas: DisponibilidadeJanelaInput[]
  classificacaoIds: string[]
  adicionalIds: string[]
}

export interface ProdutoListItem {
  id: string
  nome: string
  categoriaNome: string | null
  tipo: TipoProduto
  precoVenda: number | null
  disponibilidadeStatus: DisponibilidadeStatus
  disponivelDelivery: boolean
  disponivelLocal: boolean
  fotoUrl: string | null
  ativo: boolean
}
