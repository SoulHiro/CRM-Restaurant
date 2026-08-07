'use client'

import { FilterX, X } from 'lucide-react'

import { Badge } from '@repo/ui/components/badge'
import { Button } from '@repo/ui/components/button'

import { useQueryParams } from '@/hooks/use-query-params'
import type { EstoqueFilters } from '../../lib/estoque-helpers'

const NIVEL_LABELS: Record<string, string> = {
  zerado: 'Sem estoque',
  baixo: 'Acabando',
  ok: 'Em dia',
}

const PARAM_KEYS = {
  q: 'q',
  nivel: 'nivel',
  unidade: 'unidade',
  vencendo: 'vencendo',
  incluirInativos: 'inativos',
} as const

type FilterKey = keyof typeof PARAM_KEYS

export function EstoqueActiveFilters({ filters }: { filters: EstoqueFilters }) {
  const { setParams } = useQueryParams()

  const chips: { key: FilterKey; label: string }[] = []

  if (filters.q) chips.push({ key: 'q', label: `Busca: "${filters.q}"` })
  if (filters.nivel)
    chips.push({ key: 'nivel', label: NIVEL_LABELS[filters.nivel] ?? '' })
  if (filters.unidade)
    chips.push({ key: 'unidade', label: `Unidade: ${filters.unidade}` })
  if (filters.vencendo) chips.push({ key: 'vencendo', label: 'Vencendo' })
  if (filters.incluirInativos)
    chips.push({ key: 'incluirInativos', label: 'Com desativados' })

  if (chips.length === 0) return null

  function removeFilter(key: FilterKey) {
    setParams({ [PARAM_KEYS[key]]: null, page: null })
  }

  function clearAll() {
    setParams({
      q: null,
      nivel: null,
      unidade: null,
      vencendo: null,
      inativos: null,
      page: null,
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <Badge
          key={chip.key}
          variant="secondary"
          role="button"
          tabIndex={0}
          aria-label={`Remover filtro ${chip.label}`}
          onClick={() => removeFilter(chip.key)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              removeFilter(chip.key)
            }
          }}
          className="h-9 cursor-pointer gap-2 rounded-md px-3 text-sm font-normal hover:bg-secondary/70"
        >
          {chip.label}
          <X className="size-3.5" />
        </Badge>
      ))}

      <Button variant="outline" size="sm" className="h-9" onClick={clearAll}>
        <FilterX className="size-4" />
        Limpar filtros
      </Button>
    </div>
  )
}
