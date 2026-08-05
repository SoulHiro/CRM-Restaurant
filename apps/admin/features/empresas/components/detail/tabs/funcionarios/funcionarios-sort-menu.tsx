'use client'

import {
  ArrowDownAZ,
  ArrowUpAZ,
  ArrowUpDown,
  Building2,
  Check,
  Clock,
} from 'lucide-react'

import { Button } from '@repo/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/components/dropdown-menu'

import { useQueryParams } from '@/hooks/use-query-params'
import {
  FUNCIONARIOS_SORT_OPTIONS,
  type FuncionariosSort,
} from '../../../../lib/funcionarios-helpers'

const SORT_ICONS: Record<FuncionariosSort, typeof ArrowUpAZ> = {
  'nome-asc': ArrowUpAZ,
  'nome-desc': ArrowDownAZ,
  'setor-asc': Building2,
  'turno-asc': Clock,
}

export function FuncionariosSortMenu() {
  const { searchParams, setParams } = useQueryParams()
  const currentSort = searchParams.get('funcSort') ?? 'nome-asc'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Ordenar">
          <ArrowUpDown className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        {FUNCIONARIOS_SORT_OPTIONS.map((option) => {
          const Icon = SORT_ICONS[option.value]
          return (
            <DropdownMenuItem
              key={option.value}
              onSelect={() =>
                setParams({ funcSort: option.value, funcPage: null })
              }
            >
              <Icon className="size-4" />
              {option.label}
              {currentSort === option.value && (
                <Check className="ml-auto size-4" />
              )}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
