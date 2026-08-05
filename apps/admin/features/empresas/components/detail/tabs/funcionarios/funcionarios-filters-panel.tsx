'use client'

import { Building2, Check, CircleCheck, CircleX, Clock, X } from 'lucide-react'

import { Label } from '@repo/ui/components/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select'

import { useQueryParams } from '@/hooks/use-query-params'

export function FuncionariosFiltersPanel({
  setoresDisponiveis,
  turnosDisponiveis,
}: {
  setoresDisponiveis: string[]
  turnosDisponiveis: string[]
}) {
  const { searchParams, setParams } = useQueryParams()

  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-normal text-muted-foreground">
          Setor
        </Label>
        <Select
          value={searchParams.get('funcSetor') ?? 'todos'}
          onValueChange={(value) =>
            setParams({
              funcSetor: value === 'todos' ? null : value,
              funcPage: null,
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {setoresDisponiveis.map((setor) => (
              <SelectItem key={setor} value={setor}>
                <Building2 className="size-4 text-muted-foreground" />
                {setor}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-normal text-muted-foreground">
          Turno
        </Label>
        <Select
          value={searchParams.get('funcTurno') ?? 'todos'}
          onValueChange={(value) =>
            setParams({
              funcTurno: value === 'todos' ? null : value,
              funcPage: null,
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {turnosDisponiveis.map((turno) => (
              <SelectItem key={turno} value={turno}>
                <Clock className="size-4 text-muted-foreground" />
                {turno}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-normal text-muted-foreground">
          Vínculo
        </Label>
        <Select
          value={searchParams.get('funcVinculo') ?? 'todos'}
          onValueChange={(value) =>
            setParams({
              funcVinculo: value === 'todos' ? null : value,
              funcPage: null,
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="ativo">
              <CircleCheck className="size-4 text-primary" />
              Ativo
            </SelectItem>
            <SelectItem value="inativo">
              <CircleX className="size-4 text-muted-foreground" />
              Inativo
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-normal text-muted-foreground">
          Respondeu
        </Label>
        <Select
          value={searchParams.get('funcRespondeu') ?? 'todos'}
          onValueChange={(value) =>
            setParams({
              funcRespondeu: value === 'todos' ? null : value,
              funcPage: null,
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="sim">
              <Check className="size-4 text-sidebar" />
              Sim
            </SelectItem>
            <SelectItem value="nao">
              <X className="size-4 text-muted-foreground" />
              Não
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
