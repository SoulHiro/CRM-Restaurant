import { EmptyState } from '@repo/ui/components/empty-state'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/table'

import {
  filterFuncionarios,
  parseFuncionariosFilters,
} from '../../../../lib/funcionarios-helpers'
import type { EmpresaFuncionario } from '../../../../lib/types'
import { FuncionarioRow } from './funcionario-row'
import { FuncionariosPagination } from './funcionarios-pagination'
import { FuncionariosToolbar } from './funcionarios-toolbar'

export function FuncionariosTab({
  empresaId,
  funcionarios,
  searchParams,
}: {
  empresaId: string
  funcionarios: EmpresaFuncionario[]
  searchParams: Record<string, string | string[] | undefined>
}) {
  const filters = parseFuncionariosFilters(searchParams)
  const result = filterFuncionarios(funcionarios, filters)

  return (
    <div className="flex flex-col gap-4">
      <FuncionariosToolbar
        empresaId={empresaId}
        filters={filters}
        setoresDisponiveis={result.setoresDisponiveis}
        turnosDisponiveis={result.turnosDisponiveis}
      />

      {funcionarios.length === 0 ? (
        <EmptyState message="Nenhum funcionário vinculado a essa empresa." />
      ) : result.total === 0 ? (
        <EmptyState message="Nenhum funcionário encontrado para esse filtro." />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead>Turno</TableHead>
                <TableHead>Vínculo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.map((funcionario) => (
                <FuncionarioRow
                  key={funcionario.id}
                  empresaId={empresaId}
                  funcionario={funcionario}
                />
              ))}
            </TableBody>
          </Table>

          <FuncionariosPagination
            page={result.page}
            pageSize={result.pageSize}
            total={result.total}
            totalPages={result.totalPages}
          />
        </>
      )}
    </div>
  )
}
