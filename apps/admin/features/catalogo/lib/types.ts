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

/** Insumo elegível pra ficha técnica — só comestível/preparo/embalagem entram. */
export interface InsumoOption {
  id: string
  nome: string
  unidade: Unidade
  categoria: CategoriaEstoque
  custoUnitario: number
  /** Em quantas fichas técnicas (de outros produtos) esse insumo já aparece — usado só pra ordenar a busca, mais usado primeiro. */
  vezesUsado: number
}

export type TipoEscalaFichaTecnica = 'proporcional' | 'fixo'

/**
 * Override de uma linha "fixo" pra um tamanho específico (ex: embalagem G
 * em vez de P) — chaveado pela `key` client-side do tamanho, não por um id
 * de banco que ainda não existe no formulário. `estoqueItemId: null` = usa
 * o mesmo insumo da linha, só quantidade diferente.
 */
export interface FichaTecnicaOverrideTamanho {
  tamanhoKey: string
  estoqueItemId: string | null
  quantidade: number
}

export interface FichaTecnicaItemInput {
  estoqueItemId: string
  nome: string
  unidade: Unidade
  quantidade: number
  custoUnitario: number
  tipoEscala: TipoEscalaFichaTecnica
  /** Só relevante quando `tipoEscala === 'fixo'` e o produto tem tamanhos. */
  overridesPorTamanho: FichaTecnicaOverrideTamanho[]
}

/**
 * Um tamanho (P/M/G) de um produto com `temTamanhos = true`. `key` é um id
 * só do formulário (o registro real ainda não existe no banco) — usado pra
 * casar com `FichaTecnicaOverrideTamanho.tamanhoKey` e como React key.
 */
export interface TamanhoInput {
  key: string
  nome: string
  pesoGramas: number
  precoVenda: number
  ehBase: boolean
}

export interface CriarProdutoInput {
  nome: string
  categoriaId: string | null
  tipo: TipoProduto
  /** Só pra `features/consumo-funcionario` (staff reconhecer o item na hora de lançar consumo) — não é vitrine de cardápio digital. */
  fotoUrl: string
  fichaTecnica: FichaTecnicaItemInput[]
  tempoMedioPreparoMinutos: number
  temTamanhos: boolean
  tamanhos: TamanhoInput[]
  /** Ignorado quando `temTamanhos` — nesse caso o preço vive em `tamanhos[].precoVenda`. */
  precoVenda: number
  /** Pausa é sempre "por hoje" — ver `produto.pausado_em` no schema. */
  pausadoHoje: boolean
}

export interface ProdutoListItem {
  id: string
  nome: string
  categoriaId: string | null
  categoriaNome: string | null
  tipo: TipoProduto
  /** Preço único — null quando `temTamanhos` (usar `precoMinimo` pra exibir "a partir de"). */
  precoVenda: number | null
  temTamanhos: boolean
  /** Menor `preco_venda` entre os tamanhos — null quando não tem tamanhos ou nenhum tamanho tem preço. */
  precoMinimo: number | null
  pausadoHoje: boolean
  fotoUrl: string | null
  ativo: boolean
}

/** Dados completos de um produto pra editar — mesma forma de `CriarProdutoInput`, com id. */
export interface EditarProdutoInput extends CriarProdutoInput {
  id: string
}
