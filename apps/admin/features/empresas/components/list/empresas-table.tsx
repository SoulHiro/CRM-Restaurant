import { cn } from '@repo/ui/lib/utils'

import type { EmpresaListItem } from '../../lib/types'
import { EmpresaTableRow } from './empresa-table-row'

const GRID_COLUMNS = 'grid-cols-[2fr_1.6fr_1.6fr_0.8fr]'

export function EmpresasTable({ empresas }: { empresas: EmpresaListItem[] }) {
  return (
    <div
      role="table"
      aria-label="Empresas cadastradas"
      className="flex flex-col gap-2"
    >
      <div
        role="row"
        className={cn(
          'grid items-center gap-4 px-4 py-3 text-xs font-medium text-muted-foreground',
          GRID_COLUMNS
        )}
      >
        <span role="columnheader">Empresa</span>
        <span role="columnheader">E-mail</span>
        <span role="columnheader">Responsável</span>
        <span role="columnheader" className="text-center">
          Funcionários
        </span>
      </div>

      {empresas.map((empresa) => (
        <EmpresaTableRow
          key={empresa.id}
          empresa={empresa}
          className={cn('grid items-center gap-4 px-4 py-3', GRID_COLUMNS)}
        />
      ))}
    </div>
  )
}
