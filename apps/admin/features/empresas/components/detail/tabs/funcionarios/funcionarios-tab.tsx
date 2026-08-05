import { EmptyState } from '@repo/ui/components/empty-state'
import { cn } from '@repo/ui/lib/utils'

import {
  filterFuncionarios,
  parseFuncionariosFilters,
} from '../../../../lib/funcionarios-helpers'
import type { EmpresaFuncionario } from '../../../../lib/types'
import { FuncionarioRow } from './funcionario-row'
import { FuncionariosPagination } from './funcionarios-pagination'
import { FuncionariosToolbar } from './funcionarios-toolbar'

const GRID_COLUMNS = 'grid-cols-[2fr_1fr_1fr_1fr_0.6fr_2.5rem]'

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
          <div
            role="table"
            aria-label="Funcionários da empresa"
            className="flex flex-col gap-2"
          >
            <div
              role="row"
              className={cn(
                'grid items-center gap-4 px-4 py-3 text-xs font-medium text-muted-foreground',
                GRID_COLUMNS
              )}
            >
              <span role="columnheader">Nome</span>
              <span role="columnheader">Setor</span>
              <span role="columnheader">Turno</span>
              <span role="columnheader">Vínculo</span>
              <span role="columnheader" className="text-center">
                Respondeu
              </span>
              <span role="columnheader" className="sr-only">
                Ações
              </span>
            </div>

            {result.items.map((funcionario) => (
              <FuncionarioRow
                key={funcionario.id}
                empresaId={empresaId}
                funcionario={funcionario}
                className={cn(
                  'grid items-center gap-4 px-4 py-3',
                  GRID_COLUMNS
                )}
              />
            ))}
          </div>

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
