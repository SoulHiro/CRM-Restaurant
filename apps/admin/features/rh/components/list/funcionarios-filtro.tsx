'use client'

import { Search } from 'lucide-react'

import { Button } from '@repo/ui/components/button'
import { Input } from '@repo/ui/components/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select'
import { cn } from '@repo/ui/lib/utils'

import { useQueryParams } from '@/hooks/use-query-params'
import type { Cargo } from '../../lib/types'

const STATUS_OPCOES = [
  { valor: 'ativo', label: 'Ativos' },
  { valor: 'desligado', label: 'Desligados' },
  { valor: 'todos', label: 'Todos' },
] as const

const TODOS_CARGOS = 'todos'

export function FuncionariosFiltro({
  cargos,
  status,
  cargoId,
  busca,
}: {
  cargos: Cargo[]
  status: string
  cargoId: string
  busca: string
}) {
  const { setParams } = useQueryParams()

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative sm:w-56">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          defaultValue={busca}
          placeholder="Buscar por nome"
          aria-label="Buscar funcionário"
          className="h-11 pl-9 sm:h-9"
          onChange={(event) =>
            setParams({ busca: event.target.value || null })
          }
        />
      </div>

      <Select
        value={cargoId || TODOS_CARGOS}
        onValueChange={(valor) =>
          setParams({ cargo: valor === TODOS_CARGOS ? null : valor })
        }
      >
        <SelectTrigger className="h-11 sm:h-9 sm:w-44" aria-label="Filtrar por cargo">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TODOS_CARGOS}>Todos os cargos</SelectItem>
          {cargos.map((cargo) => (
            <SelectItem key={cargo.id} value={cargo.id}>
              {cargo.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex flex-wrap gap-1" role="group" aria-label="Filtrar por situação">
        {STATUS_OPCOES.map((opcao) => (
          <Button
            key={opcao.valor}
            size="sm"
            variant={status === opcao.valor ? 'secondary' : 'ghost'}
            aria-pressed={status === opcao.valor}
            className={cn(status === opcao.valor && 'font-semibold')}
            onClick={() =>
              setParams({ status: opcao.valor === 'ativo' ? null : opcao.valor })
            }
          >
            {opcao.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
