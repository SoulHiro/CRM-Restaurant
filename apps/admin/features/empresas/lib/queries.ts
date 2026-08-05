import 'server-only'

import type { EmpresaDetail, EmpresaListItem } from './types'
import { mockEmpresas } from './mock-data/empresas'
import { EMPTY_DETAIL, mockEmpresaDetails } from './mock-data/empresa-details'

export async function getEmpresas(): Promise<EmpresaListItem[]> {
  return mockEmpresas
}

export async function getEmpresaById(
  id: string
): Promise<EmpresaListItem | null> {
  return mockEmpresas.find((empresa) => empresa.id === id) ?? null
}

export async function getEmpresaDetail(id: string): Promise<EmpresaDetail> {
  return mockEmpresaDetails[id] ?? EMPTY_DETAIL
}
