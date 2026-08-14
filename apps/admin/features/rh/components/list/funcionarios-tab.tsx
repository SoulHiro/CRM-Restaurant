import { EmptyState } from '@repo/ui/components/empty-state'
import { cn } from '@repo/ui/lib/utils'

import { filtrarFuncionarios } from '../../lib/salario-helpers'
import type {
  Cargo,
  FuncionarioListItem,
  TurnoTrabalho,
} from '../../lib/types'
import { AdmitirFuncionarioDrawer } from '../form/admitir-funcionario-drawer'
import { FuncionarioRow } from './funcionario-row'
import { FuncionariosFiltro } from './funcionarios-filtro'

const GRID_COLUMNS = 'sm:grid-cols-[2fr_1.3fr_1.2fr_1fr_1fr]'

export function FuncionariosTab({
  funcionarios,
  cargos,
  filtros,
  hoje,
}: {
  funcionarios: FuncionarioListItem[]
  cargos: Cargo[]
  filtros: {
    busca: string
    cargoId: string
    status: 'ativo' | 'desligado' | 'todos'
    turno: TurnoTrabalho | 'todos'
  }
  hoje: string
}) {
  const visiveis = filtrarFuncionarios(funcionarios, filtros)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <FuncionariosFiltro
          cargos={cargos}
          status={filtros.status}
          cargoId={filtros.cargoId}
          busca={filtros.busca}
        />
        <AdmitirFuncionarioDrawer cargos={cargos} hoje={hoje} />
      </div>

      {visiveis.length === 0 ? (
        <EmptyState
          message={
            cargos.length === 0
              ? 'Crie um cargo primeiro — é dele que sai o salário base ao admitir alguém.'
              : funcionarios.length === 0
                ? 'Nenhum funcionário cadastrado. Admita a equipe para poder fechar a folha do mês.'
                : 'Nenhum funcionário com esse filtro.'
          }
        />
      ) : (
        <div role="table" aria-label="Equipe" className="flex flex-col gap-2">
          <div
            role="row"
            className={cn(
              'hidden items-center gap-4 px-4 py-3 text-xs font-medium text-muted-foreground sm:grid',
              GRID_COLUMNS
            )}
          >
            <span role="columnheader">Nome</span>
            <span role="columnheader">Cargo</span>
            <span role="columnheader">Situação</span>
            <span role="columnheader" className="text-right">
              Salário
            </span>
            <span role="columnheader">Na casa há</span>
          </div>

          {visiveis.map((funcionario) => (
            <FuncionarioRow
              key={funcionario.id}
              funcionario={funcionario}
              gridColumns={GRID_COLUMNS}
              hoje={hoje}
            />
          ))}
        </div>
      )}
    </div>
  )
}
