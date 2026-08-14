import { EmptyState } from '@repo/ui/components/empty-state'
import { MobileCellLabel } from '@repo/ui/components/mobile-cell-label'
import { cn } from '@repo/ui/lib/utils'

import { formatCurrencyBRL } from '@/lib/formatters'
import type { Cargo } from '../../lib/types'
import { CargoDrawer } from '../form/cargo-drawer'
import { ExcluirCargoButton } from './excluir-cargo-button'

const GRID_COLUMNS = 'sm:grid-cols-[2fr_1fr_1fr_2.5rem_2.5rem]'

export function CargosTab({ cargos }: { cargos: Cargo[] }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <CargoDrawer />
      </div>

      {cargos.length === 0 ? (
        <EmptyState message="Nenhum cargo criado. O cargo define o salário base que aparece ao admitir alguém." />
      ) : (
        <div role="table" aria-label="Cargos" className="flex flex-col gap-2">
          <div
            role="row"
            className={cn(
              'hidden items-center gap-4 px-4 py-3 text-xs font-medium text-muted-foreground sm:grid',
              GRID_COLUMNS
            )}
          >
            <span role="columnheader">Cargo</span>
            <span role="columnheader" className="text-right">
              Salário base
            </span>
            <span role="columnheader" className="text-right">
              Ocupantes
            </span>
            <span role="columnheader" className="sr-only">
              Editar
            </span>
            <span role="columnheader" className="sr-only">
              Excluir
            </span>
          </div>

          {cargos.map((cargo) => (
            <div
              key={cargo.id}
              role="row"
              className={cn(
                'rounded-lg bg-card',
                'flex flex-col gap-2 p-4 sm:grid sm:items-center sm:gap-4 sm:py-3',
                GRID_COLUMNS
              )}
            >
              <span role="cell" className="min-w-0 truncate font-medium">
                {cargo.nome}
              </span>

              <span
                role="cell"
                className="flex items-center justify-between gap-2 text-sm font-medium tabular-nums sm:block sm:text-right"
              >
                <MobileCellLabel>Salário base</MobileCellLabel>
                {cargo.salarioBase > 0
                  ? formatCurrencyBRL(cargo.salarioBase)
                  : 'por diária'}
              </span>

              <span
                role="cell"
                className="flex items-center justify-between gap-2 text-sm text-muted-foreground tabular-nums sm:block sm:text-right"
              >
                <MobileCellLabel>Ocupantes</MobileCellLabel>
                {cargo.ocupantes}
              </span>

              <span role="cell" className="flex justify-end">
                <CargoDrawer cargo={cargo} />
              </span>

              <span role="cell" className="flex justify-end">
                <ExcluirCargoButton cargo={cargo} />
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
