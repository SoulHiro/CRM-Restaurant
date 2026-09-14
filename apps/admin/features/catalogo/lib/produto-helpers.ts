import { TIPOS_PRODUTO } from './types'
import type { ProdutoListItem, TipoProduto } from './types'

export interface ProdutoFilters {
  q: string
  tipo: TipoProduto | ''
  categoriaId: string
}

type SearchParamsRecord = Record<string, string | string[] | undefined>

function readParam(searchParams: SearchParamsRecord, key: string): string {
  const value = searchParams[key]
  return typeof value === 'string' ? value : ''
}

export function parseProdutoFilters(
  searchParams: SearchParamsRecord
): ProdutoFilters {
  const tipoParam = readParam(searchParams, 'tipo')

  return {
    q: readParam(searchParams, 'q'),
    tipo: (TIPOS_PRODUTO as readonly string[]).includes(tipoParam)
      ? (tipoParam as TipoProduto)
      : '',
    categoriaId: readParam(searchParams, 'categoria'),
  }
}

export function filterProdutos<T extends ProdutoListItem>(
  produtos: T[],
  filters: ProdutoFilters
): T[] {
  const query = filters.q.trim().toLowerCase()

  return produtos.filter((produto) => {
    if (query && !produto.nome.toLowerCase().includes(query)) return false
    if (filters.tipo && produto.tipo !== filters.tipo) return false
    if (filters.categoriaId && produto.categoriaId !== filters.categoriaId)
      return false
    return true
  })
}
