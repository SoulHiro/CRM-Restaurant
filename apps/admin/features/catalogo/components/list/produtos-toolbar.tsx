'use client'

import { useEffect, useRef, useState } from 'react'
import { FilterX, Search } from 'lucide-react'

import { Button } from '@repo/ui/components/button'
import { Input } from '@repo/ui/components/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select'
import { ToggleGroup, ToggleGroupItem } from '@repo/ui/components/toggle-group'

import { useQueryParams } from '@/hooks/use-query-params'
import { TIPO_PRODUTO_LABEL, TIPOS_PRODUTO } from '../../lib/types'
import type { CategoriaProdutoOption } from '../../lib/types'

const TODAS_CATEGORIAS = 'todas'

function ProdutosSearchInput() {
  const { searchParams, setParams } = useQueryParams()
  const urlValue = searchParams.get('q') ?? ''
  const [value, setValue] = useState(urlValue)
  const lastPushedRef = useRef(urlValue)

  useEffect(() => {
    if (urlValue !== lastPushedRef.current) {
      lastPushedRef.current = urlValue
      setValue(urlValue)
    }
  }, [urlValue])

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (value === lastPushedRef.current) return
      lastPushedRef.current = value
      setParams({ q: value || null })
    }, 300)

    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <div className="relative w-full sm:w-64">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Buscar produto..."
        className="pl-8"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  )
}

export function ProdutosToolbar({
  categorias,
}: {
  categorias: CategoriaProdutoOption[]
}) {
  const { searchParams, setParams } = useQueryParams()

  const tipo = searchParams.get('tipo') ?? ''
  const canal = searchParams.get('canal') ?? ''
  const turno = searchParams.get('turno') ?? ''
  const categoriaId = searchParams.get('categoria') ?? TODAS_CATEGORIAS

  const temFiltroAtivo =
    tipo || canal || turno || categoriaId !== TODAS_CATEGORIAS || searchParams.get('q')

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ProdutosSearchInput />

        <Select
          value={categoriaId}
          onValueChange={(value) =>
            setParams({ categoria: value === TODAS_CATEGORIAS ? null : value })
          }
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODAS_CATEGORIAS}>Todas categorias</SelectItem>
            {categorias.map((categoria) => (
              <SelectItem key={categoria.id} value={categoria.id}>
                {categoria.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
        <ToggleGroup
          type="single"
          variant="outline"
          value={tipo}
          onValueChange={(value) => setParams({ tipo: value || null })}
        >
          {TIPOS_PRODUTO.map((t) => (
            <ToggleGroupItem key={t} value={t} className="text-xs">
              {TIPO_PRODUTO_LABEL[t]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <ToggleGroup
          type="single"
          variant="outline"
          value={canal}
          onValueChange={(value) => setParams({ canal: value || null })}
        >
          <ToggleGroupItem value="local" className="text-xs">
            Local
          </ToggleGroupItem>
          <ToggleGroupItem value="delivery" className="text-xs">
            Delivery
          </ToggleGroupItem>
        </ToggleGroup>

        <ToggleGroup
          type="single"
          variant="outline"
          value={turno}
          onValueChange={(value) => setParams({ turno: value || null })}
        >
          <ToggleGroupItem value="almoco" className="text-xs">
            Almoço
          </ToggleGroupItem>
          <ToggleGroupItem value="janta" className="text-xs">
            Janta
          </ToggleGroupItem>
        </ToggleGroup>

        {temFiltroAtivo && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-muted-foreground"
            onClick={() =>
              setParams({ q: null, tipo: null, canal: null, turno: null, categoria: null })
            }
          >
            <FilterX className="size-4" />
            Limpar filtros
          </Button>
        )}
      </div>
    </div>
  )
}
