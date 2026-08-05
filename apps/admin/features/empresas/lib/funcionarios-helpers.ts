import type { EmpresaFuncionario } from './types'

export const FUNCIONARIOS_PAGE_SIZES = [5, 10, 25, 50] as const
export type FuncionariosPageSize = (typeof FUNCIONARIOS_PAGE_SIZES)[number]

export const FUNCIONARIOS_SORT_OPTIONS = [
  { value: 'nome-asc', label: 'Nome (A-Z)' },
  { value: 'nome-desc', label: 'Nome (Z-A)' },
  { value: 'setor-asc', label: 'Setor (A-Z)' },
  { value: 'turno-asc', label: 'Turno (A-Z)' },
] as const
export type FuncionariosSort =
  (typeof FUNCIONARIOS_SORT_OPTIONS)[number]['value']

export interface FuncionariosFilters {
  q: string
  setor: string
  turno: string
  vinculo: 'ativo' | 'inativo' | ''
  respondeu: 'sim' | 'nao' | ''
  sort: FuncionariosSort
  page: number
  pageSize: FuncionariosPageSize
}

type SearchParamsRecord = Record<string, string | string[] | undefined>

function readParam(searchParams: SearchParamsRecord, key: string): string {
  const value = searchParams[key]
  return typeof value === 'string' ? value : ''
}

export function parseFuncionariosFilters(
  searchParams: SearchParamsRecord
): FuncionariosFilters {
  const pageSizeParam = Number(readParam(searchParams, 'funcPageSize'))
  const pageSize = FUNCIONARIOS_PAGE_SIZES.includes(
    pageSizeParam as FuncionariosPageSize
  )
    ? (pageSizeParam as FuncionariosPageSize)
    : 10

  const sortParam = readParam(searchParams, 'funcSort')
  const sort = FUNCIONARIOS_SORT_OPTIONS.some(
    (option) => option.value === sortParam
  )
    ? (sortParam as FuncionariosSort)
    : 'nome-asc'

  const pageParam = Number(readParam(searchParams, 'funcPage'))
  const vinculoParam = readParam(searchParams, 'funcVinculo')
  const respondeuParam = readParam(searchParams, 'funcRespondeu')

  return {
    q: readParam(searchParams, 'funcQ'),
    setor: readParam(searchParams, 'funcSetor'),
    turno: readParam(searchParams, 'funcTurno'),
    vinculo:
      vinculoParam === 'ativo' || vinculoParam === 'inativo'
        ? vinculoParam
        : '',
    respondeu:
      respondeuParam === 'sim' || respondeuParam === 'nao'
        ? respondeuParam
        : '',
    sort,
    page: Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1,
    pageSize,
  }
}

export interface FuncionariosResult {
  items: EmpresaFuncionario[]
  total: number
  page: number
  pageSize: FuncionariosPageSize
  totalPages: number
  setoresDisponiveis: string[]
  turnosDisponiveis: string[]
}

function compareFuncionarios(sort: FuncionariosSort) {
  return (a: EmpresaFuncionario, b: EmpresaFuncionario) => {
    switch (sort) {
      case 'nome-desc':
        return b.nome.localeCompare(a.nome, 'pt-BR')
      case 'setor-asc':
        return a.setor.localeCompare(b.setor, 'pt-BR')
      case 'turno-asc':
        return a.turno.localeCompare(b.turno, 'pt-BR')
      default:
        return a.nome.localeCompare(b.nome, 'pt-BR')
    }
  }
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

export function filterFuncionarios(
  funcionarios: EmpresaFuncionario[],
  filters: FuncionariosFilters
): FuncionariosResult {
  const setoresDisponiveis = uniqueSorted(funcionarios.map((f) => f.setor))
  const turnosDisponiveis = uniqueSorted(funcionarios.map((f) => f.turno))

  const query = filters.q.trim().toLowerCase()

  const filtered = funcionarios.filter((funcionario) => {
    if (query && !funcionario.nome.toLowerCase().includes(query)) return false
    if (filters.setor && funcionario.setor !== filters.setor) return false
    if (filters.turno && funcionario.turno !== filters.turno) return false
    if (filters.vinculo && funcionario.vinculoStatus !== filters.vinculo)
      return false
    if (
      filters.respondeu &&
      (filters.respondeu === 'sim') !== funcionario.respondeuEstaSemana
    )
      return false
    return true
  })

  const sorted = [...filtered].sort(compareFuncionarios(filters.sort))

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
    setoresDisponiveis,
    turnosDisponiveis,
  }
}
