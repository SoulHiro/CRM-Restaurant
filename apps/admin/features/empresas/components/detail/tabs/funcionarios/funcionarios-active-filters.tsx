'use client'

import { FilterX, X } from 'lucide-react'

import { Badge } from '@repo/ui/components/badge'
import { Button } from '@repo/ui/components/button'

import { useQueryParams } from '@/hooks/use-query-params'
import type { FuncionariosFilters } from '../../../../lib/funcionarios-helpers'

const VINCULO_LABELS: Record<string, string> = {
  ativo: 'Ativo',
  inativo: 'Inativo',
}

const RESPONDEU_LABELS: Record<string, string> = {
  sim: 'Sim',
  nao: 'Não',
}

const FILTER_PARAM_KEYS = {
  q: 'funcQ',
  setor: 'funcSetor',
  turno: 'funcTurno',
  vinculo: 'funcVinculo',
  respondeu: 'funcRespondeu',
} as const

type FilterKey = keyof typeof FILTER_PARAM_KEYS

export function FuncionariosActiveFilters({
  filters,
}: {
  filters: FuncionariosFilters
}) {
  const { setParams } = useQueryParams()

  const chips: { key: FilterKey; label: string }[] = []

  if (filters.q) chips.push({ key: 'q', label: `Busca: "${filters.q}"` })
  if (filters.setor)
    chips.push({ key: 'setor', label: `Setor: ${filters.setor}` })
  if (filters.turno)
    chips.push({ key: 'turno', label: `Turno: ${filters.turno}` })
  if (filters.vinculo)
    chips.push({
      key: 'vinculo',
      label: `Vínculo: ${VINCULO_LABELS[filters.vinculo]}`,
    })
  if (filters.respondeu)
    chips.push({
      key: 'respondeu',
      label: `Respondeu: ${RESPONDEU_LABELS[filters.respondeu]}`,
    })

  if (chips.length === 0) return null

  function removeFilter(key: FilterKey) {
    setParams({ [FILTER_PARAM_KEYS[key]]: null, funcPage: null })
  }

  function clearAll() {
    setParams({
      funcQ: null,
      funcSetor: null,
      funcTurno: null,
      funcVinculo: null,
      funcRespondeu: null,
      funcPage: null,
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
