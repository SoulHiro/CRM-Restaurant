import { TIPOS_PRODUTO } from './types'
import type { ProdutoListItem, TipoProduto } from './types'

export const CANAL_FILTROS = ['delivery', 'local'] as const
export type CanalFiltro = (typeof CANAL_FILTROS)[number]

export const TURNO_FILTROS = ['almoco', 'janta'] as const
export type TurnoFiltro = (typeof TURNO_FILTROS)[number]

export interface ProdutoFilters {
  q: string
  tipo: TipoProduto | ''
  canal: CanalFiltro | ''
  turno: TurnoFiltro | ''
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
  const canalParam = readParam(searchParams, 'canal')
  const turnoParam = readParam(searchParams, 'turno')

  return {
    q: readParam(searchParams, 'q'),
    tipo: (TIPOS_PRODUTO as readonly string[]).includes(tipoParam)
      ? (tipoParam as TipoProduto)
      : '',
    canal: (CANAL_FILTROS as readonly string[]).includes(canalParam)
      ? (canalParam as CanalFiltro)
      : '',
    turno: (TURNO_FILTROS as readonly string[]).includes(turnoParam)
      ? (turnoParam as TurnoFiltro)
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
    if (filters.canal === 'delivery' && !produto.disponivelDelivery)
      return false
    if (filters.canal === 'local' && !produto.disponivelLocal) return false
    if (filters.turno === 'almoco' && !produto.apareceAlmoco) return false
    if (filters.turno === 'janta' && !produto.apareceJanta) return false
    if (filters.categoriaId && produto.categoriaId !== filters.categoriaId)
      return false
    return true
  })
}
