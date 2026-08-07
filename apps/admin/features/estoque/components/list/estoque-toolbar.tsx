'use client'

import { useState } from 'react'
import { ListFilter } from 'lucide-react'

import { Button } from '@repo/ui/components/button'

import type { EstoqueFilters } from '../../lib/estoque-helpers'
import type { Unidade } from '../../lib/types'
import { CadastrarItemDrawer } from '../form/cadastrar-item-drawer'
import { EstoqueActiveFilters } from './estoque-active-filters'
import { EstoqueFiltersPanel } from './estoque-filters-panel'
import { EstoqueSearchInput } from './estoque-search-input'
import { EstoqueSortMenu } from './estoque-sort-menu'

export function EstoqueToolbar({
  filters,
  unidadesDisponiveis,
}: {
  filters: EstoqueFilters
  unidadesDisponiveis: Unidade[]
}) {
  const [filtersOpen, setFiltersOpen] = useState(false)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <EstoqueSearchInput />
          <Button
            variant={filtersOpen ? 'secondary' : 'outline'}
            size="icon"
            className="shrink-0"
            aria-label="Filtrar"
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen((open) => !open)}
          >
            <ListFilter className="size-4" />
          </Button>
          <EstoqueSortMenu />
        </div>

        <CadastrarItemDrawer />
      </div>

      <EstoqueActiveFilters filters={filters} />

      {filtersOpen && (
        <EstoqueFiltersPanel unidadesDisponiveis={unidadesDisponiveis} />
      )}
    </div>
  )
}
