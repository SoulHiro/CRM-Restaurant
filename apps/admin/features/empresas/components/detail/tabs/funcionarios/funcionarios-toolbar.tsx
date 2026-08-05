'use client'

import { useState } from 'react'
import { ListFilter } from 'lucide-react'

import { Button } from '@repo/ui/components/button'

import type { FuncionariosFilters } from '../../../../lib/funcionarios-helpers'
import { CadastrarFuncionarioDrawer } from '../../../form/cadastrar-funcionario-drawer'
import { FuncionariosActiveFilters } from './funcionarios-active-filters'
import { FuncionariosFiltersPanel } from './funcionarios-filters-panel'
import { FuncionariosSearchInput } from './funcionarios-search-input'
import { FuncionariosSortMenu } from './funcionarios-sort-menu'

export function FuncionariosToolbar({
  empresaId,
  filters,
  setoresDisponiveis,
  turnosDisponiveis,
}: {
  empresaId: string
  filters: FuncionariosFilters
  setoresDisponiveis: string[]
  turnosDisponiveis: string[]
}) {
  const [filtersOpen, setFiltersOpen] = useState(false)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <FuncionariosSearchInput />
          <Button
            variant={filtersOpen ? 'secondary' : 'outline'}
            size="icon"
            aria-label="Filtrar"
            onClick={() => setFiltersOpen((open) => !open)}
          >
            <ListFilter className="size-4" />
          </Button>
          <FuncionariosSortMenu />
        </div>

        <CadastrarFuncionarioDrawer empresaId={empresaId} />
      </div>

      <FuncionariosActiveFilters filters={filters} />

      {filtersOpen && (
        <FuncionariosFiltersPanel
          setoresDisponiveis={setoresDisponiveis}
          turnosDisponiveis={turnosDisponiveis}
        />
      )}
    </div>
  )
}
