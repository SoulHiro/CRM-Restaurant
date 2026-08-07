'use client'

import { CalendarClock, CircleAlert, CircleCheck, CircleX } from 'lucide-react'

import { Checkbox } from '@repo/ui/components/checkbox'
import { Label } from '@repo/ui/components/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select'

import { useQueryParams } from '@/hooks/use-query-params'
import { UNIDADE_LABELS } from '../../lib/estoque-helpers'
import type { Unidade } from '../../lib/types'

export function EstoqueFiltersPanel({
  unidadesDisponiveis,
}: {
  unidadesDisponiveis: Unidade[]
}) {
  const { searchParams, setParams } = useQueryParams()

  return (
    <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-normal text-muted-foreground">
          Situação
        </Label>
        <Select
          value={searchParams.get('nivel') ?? 'todos'}
          onValueChange={(value) =>
            setParams({ nivel: value === 'todos' ? null : value, page: null })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas</SelectItem>
            <SelectItem value="zerado">
              <CircleX className="size-4 text-destructive" />
              Sem estoque
            </SelectItem>
            <SelectItem value="baixo">
              <CircleAlert className="size-4 text-amber-500" />
              Acabando
            </SelectItem>
            <SelectItem value="ok">
              <CircleCheck className="size-4 text-emerald-500" />
              Em dia
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-normal text-muted-foreground">
          Unidade
        </Label>
        <Select
          value={searchParams.get('unidade') ?? 'todas'}
          onValueChange={(value) =>
            setParams({ unidade: value === 'todas' ? null : value, page: null })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            {unidadesDisponiveis.map((unidade) => (
              <SelectItem key={unidade} value={unidade}>
                {unidade} — {UNIDADE_LABELS[unidade]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <label className="flex h-11 cursor-pointer items-center gap-2 text-sm sm:h-9">
        <Checkbox
          checked={searchParams.get('vencendo') === '1'}
          onCheckedChange={(checked) =>
            setParams({ vencendo: checked ? '1' : null, page: null })
          }
        />
        <CalendarClock className="size-4 text-muted-foreground" />
        Só o que está vencendo
      </label>

      <label className="flex h-11 cursor-pointer items-center gap-2 text-sm sm:h-9">
        <Checkbox
          checked={searchParams.get('inativos') === '1'}
          onCheckedChange={(checked) =>
            setParams({ inativos: checked ? '1' : null, page: null })
          }
        />
        Mostrar desativados
      </label>
    </div>
  )
}
