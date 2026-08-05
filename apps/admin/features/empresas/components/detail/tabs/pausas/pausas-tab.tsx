import { EmptyState } from '@repo/ui/components/empty-state'
import { cn } from '@repo/ui/lib/utils'

import type { EmpresaPausa } from '../../../../lib/types'
import { CadastrarPausaDrawer } from '../../../form/cadastrar-pausa-drawer'
import { PausaRow } from './pausa-row'

const GRID_COLUMNS = 'grid-cols-[1fr_2fr_2.5rem]'

export function PausasTab({
  empresaId,
  pausas,
}: {
  empresaId: string
  pausas: EmpresaPausa[]
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <CadastrarPausaDrawer empresaId={empresaId} />
      </div>

      {pausas.length === 0 ? (
        <EmptyState message="Nenhuma pausa registrada." />
      ) : (
        <div
          role="table"
          aria-label="Pausas da empresa"
          className="flex flex-col gap-2"
        >
          <div
            role="row"
            className={cn(
              'grid items-center gap-4 px-4 py-3 text-xs font-medium text-muted-foreground',
              GRID_COLUMNS
            )}
          >
            <span role="columnheader">Data</span>
            <span role="columnheader">Motivo</span>
            <span role="columnheader" className="sr-only">
              Ações
            </span>
          </div>

          {pausas.map((pausa) => (
            <PausaRow
              key={pausa.id}
              pausa={pausa}
              className={cn('grid items-center gap-4 px-4 py-3', GRID_COLUMNS)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
