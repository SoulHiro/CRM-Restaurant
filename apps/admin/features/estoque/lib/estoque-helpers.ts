import type {
  AlertasEstoque,
  EstoqueItem,
  NivelEstoque,
  Unidade,
} from './types'

export const DIAS_ALERTA_VENCIMENTO = 3

export const UNIDADE_LABELS: Record<Unidade, string> = {
  un: 'unidade',
  kg: 'quilo',
  g: 'grama',
  l: 'litro',
  ml: 'mililitro',
  cx: 'caixa',
  pct: 'pacote',
}

export function nivelEstoque(item: {
  quantidadeAtual: number
  pontoReposicao: number
}): NivelEstoque {
  if (item.quantidadeAtual <= 0) return 'zerado'
  if (item.quantidadeAtual <= item.pontoReposicao) return 'baixo'
  return 'ok'
}

/**
 * Compara em dias de calendário, não em milissegundos: `validade` vem do
 * Postgres como 'YYYY-MM-DD' sem hora, então o fuso do servidor não pode
 * deslocar a contagem em um dia.
 */
export function diasAteVencer(validade: string, hoje: string): number {
  const MS_POR_DIA = 86_400_000
  const inicio = Date.parse(`${hoje.slice(0, 10)}T00:00:00Z`)
  const fim = Date.parse(`${validade.slice(0, 10)}T00:00:00Z`)
  return Math.round((fim - inicio) / MS_POR_DIA)
}

export function selecionarAlertas(
  itens: EstoqueItem[],
  hoje: string,
  janelaDias = DIAS_ALERTA_VENCIMENTO
): AlertasEstoque {
  const estoqueBaixo = itens
    .filter((item) => item.ativo && nivelEstoque(item) !== 'ok')
    .map((item) => ({
      itemId: item.id,
      nome: item.nome,
      unidade: item.unidade,
      quantidadeAtual: item.quantidadeAtual,
      pontoReposicao: item.pontoReposicao,
      nivel: nivelEstoque(item) as 'zerado' | 'baixo',
    }))
    .sort((a, b) => a.quantidadeAtual - b.quantidadeAtual)

  const vencimentoProximo = itens
    .filter((item) => item.ativo && item.validade != null)
    .map((item) => ({
      itemId: item.id,
      nome: item.nome,
      unidade: item.unidade,
      quantidadeAtual: item.quantidadeAtual,
      validade: item.validade as string,
      diasRestantes: diasAteVencer(item.validade as string, hoje),
    }))
    .filter((alerta) => alerta.diasRestantes <= janelaDias)
    .sort((a, b) => a.diasRestantes - b.diasRestantes)

  return { estoqueBaixo, vencimentoProximo }
}

export const ESTOQUE_PAGE_SIZES = [10, 25, 50, 100] as const
export type EstoquePageSize = (typeof ESTOQUE_PAGE_SIZES)[number]

export const ESTOQUE_SORT_OPTIONS = [
  { value: 'nome-asc', label: 'Nome (A-Z)' },
  { value: 'nome-desc', label: 'Nome (Z-A)' },
  { value: 'saldo-asc', label: 'Menor quantidade' },
  { value: 'saldo-desc', label: 'Maior quantidade' },
  { value: 'validade-asc', label: 'Vence antes' },
] as const
export type EstoqueSort = (typeof ESTOQUE_SORT_OPTIONS)[number]['value']

export const ESTOQUE_NIVEL_FILTROS = ['baixo', 'zerado', 'ok'] as const

export interface EstoqueFilters {
  q: string
  unidade: string
  nivel: NivelEstoque | ''
  vencendo: boolean
  incluirInativos: boolean
  sort: EstoqueSort
  page: number
  pageSize: EstoquePageSize
}

type SearchParamsRecord = Record<string, string | string[] | undefined>

function readParam(searchParams: SearchParamsRecord, key: string): string {
  const value = searchParams[key]
  return typeof value === 'string' ? value : ''
}

export function parseEstoqueFilters(
  searchParams: SearchParamsRecord
): EstoqueFilters {
  const pageSizeParam = Number(readParam(searchParams, 'pageSize'))
  const pageSize = ESTOQUE_PAGE_SIZES.includes(pageSizeParam as EstoquePageSize)
    ? (pageSizeParam as EstoquePageSize)
    : 25

  const sortParam = readParam(searchParams, 'sort')
  const sort = ESTOQUE_SORT_OPTIONS.some((option) => option.value === sortParam)
    ? (sortParam as EstoqueSort)
    : 'nome-asc'

  const pageParam = Number(readParam(searchParams, 'page'))
  const nivelParam = readParam(searchParams, 'nivel')
  const unidadeParam = readParam(searchParams, 'unidade')

  return {
    q: readParam(searchParams, 'q'),
    unidade: unidadeParam,
    nivel: (ESTOQUE_NIVEL_FILTROS as readonly string[]).includes(nivelParam)
      ? (nivelParam as NivelEstoque)
      : '',
    vencendo: readParam(searchParams, 'vencendo') === '1',
    incluirInativos: readParam(searchParams, 'inativos') === '1',
    sort,
    page: Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1,
    pageSize,
  }
}

export interface EstoqueResult<T extends EstoqueItem = EstoqueItem> {
  items: T[]
  total: number
  page: number
  pageSize: EstoquePageSize
  totalPages: number
  unidadesDisponiveis: Unidade[]
}

function compareItens(sort: EstoqueSort) {
  return (a: EstoqueItem, b: EstoqueItem) => {
    switch (sort) {
      case 'nome-desc':
        return b.nome.localeCompare(a.nome, 'pt-BR')
      case 'saldo-asc':
        return a.quantidadeAtual - b.quantidadeAtual
      case 'saldo-desc':
        return b.quantidadeAtual - a.quantidadeAtual
      case 'validade-asc':
        if (a.validade == null) return b.validade == null ? 0 : 1
        if (b.validade == null) return -1
        return a.validade.localeCompare(b.validade)
      default:
        return a.nome.localeCompare(b.nome, 'pt-BR')
    }
  }
}

export function filterEstoque<T extends EstoqueItem>(
  itens: T[],
  filters: EstoqueFilters,
  hoje: string
): EstoqueResult<T> {
  const unidadesDisponiveis = Array.from(
    new Set(itens.map((item) => item.unidade))
  ).sort()

  const query = filters.q.trim().toLowerCase()

  const filtered = itens.filter((item) => {
    if (!filters.incluirInativos && !item.ativo) return false
    if (query && !item.nome.toLowerCase().includes(query)) return false
    if (filters.unidade && item.unidade !== filters.unidade) return false
    if (filters.nivel && nivelEstoque(item) !== filters.nivel) return false
    if (filters.vencendo) {
      if (item.validade == null) return false
      if (diasAteVencer(item.validade, hoje) > DIAS_ALERTA_VENCIMENTO)
        return false
    }
    return true
  })

  const sorted = [...filtered].sort(compareItens(filters.sort))

  const total = sorted.length
  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize))
  const page = Math.min(filters.page, totalPages)
  const start = (page - 1) * filters.pageSize

  return {
    items: sorted.slice(start, start + filters.pageSize),
    total,
    page,
    pageSize: filters.pageSize,
    totalPages,
    unidadesDisponiveis,
  }
}
