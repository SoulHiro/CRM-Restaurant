import type { CategoriaEstoque, Unidade } from '@/features/estoque/lib/types'

export const TIPOS_PRODUTO = ['comida', 'bebida'] as const
export type TipoProduto = (typeof TIPOS_PRODUTO)[number]

export const TIPO_PRODUTO_LABEL: Record<TipoProduto, string> = {
  comida: 'Comida',
  bebida: 'Bebida',
}

export interface CategoriaProdutoOption {
  id: string
  nome: string
}

export interface AdicionalItemOption {
  id: string
  grupoId: string
  nome: string
  preco: number
  fotoUrl: string | null
  quantidadeMinima: number
  quantidadeMaxima: number
  ativo: boolean
}

export interface GrupoAdicionalOption {
  id: string
  nome: string
  disponivelAlmoco: boolean
  disponivelJanta: boolean
  ativo: boolean
  itens: AdicionalItemOption[]
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
  /** Pausa é sempre "por hoje" — ver `produto.pausado_em` no schema. */
  pausadoHoje: boolean
  apareceAlmoco: boolean
  apareceJanta: boolean
  /** Em quais dias da semana (0=domingo...6=sábado) aparece. Vazio = todo dia. */
  diasSemana: number[]
  /** Chaves fixas de `lib/classificacoes.ts` — sem entidade de banco. */
  classificacoes: string[]
  grupoAdicionalIds: string[]
}

export interface ProdutoListItem {
  id: string
  nome: string
  categoriaId: string | null
  categoriaNome: string | null
  tipo: TipoProduto
  precoVenda: number | null
  pausadoHoje: boolean
  disponivelDelivery: boolean
  disponivelLocal: boolean
  apareceAlmoco: boolean
  apareceJanta: boolean
  fotoUrl: string | null
  ativo: boolean
}
