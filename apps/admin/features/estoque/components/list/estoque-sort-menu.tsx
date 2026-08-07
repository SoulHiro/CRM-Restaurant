'use client'

import {
  ArrowDown01,
  ArrowDownAZ,
  ArrowUp01,
  ArrowUpAZ,
  ArrowUpDown,
  CalendarClock,
  Check,
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
  ESTOQUE_SORT_OPTIONS,
  type EstoqueSort,
} from '../../lib/estoque-helpers'

const SORT_ICONS: Record<EstoqueSort, typeof ArrowUpAZ> = {
  'nome-asc': ArrowUpAZ,
  'nome-desc': ArrowDownAZ,
  'saldo-asc': ArrowUp01,
  'saldo-desc': ArrowDown01,
  'validade-asc': CalendarClock,
}

export function EstoqueSortMenu() {
  const { searchParams, setParams } = useQueryParams()
  const currentSort = searchParams.get('sort') ?? 'nome-asc'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Ordenar">
          <ArrowUpDown className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        {ESTOQUE_SORT_OPTIONS.map((option) => {
          const Icon = SORT_ICONS[option.value]
          return (
            <DropdownMenuItem
              key={option.value}
              onSelect={() => setParams({ sort: option.value, page: null })}
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
