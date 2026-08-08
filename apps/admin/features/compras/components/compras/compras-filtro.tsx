'use client'

import { Button } from '@repo/ui/components/button'
import { cn } from '@repo/ui/lib/utils'

import { useQueryParams } from '@/hooks/use-query-params'
import {
  COMPRA_FILTROS,
  COMPRA_STATUS_LABEL,
  type CompraFiltro,
} from '../../lib/compra-helpers'

export function ComprasFiltro({ filtro }: { filtro: CompraFiltro }) {
  const { setParams } = useQueryParams()

  return (
    <div
      className="flex flex-wrap gap-1"
      role="group"
      aria-label="Filtrar compras"
    >
      {COMPRA_FILTROS.map((opcao) => (
        <Button
          key={opcao}
          size="sm"
          variant={filtro === opcao ? 'secondary' : 'ghost'}
          aria-pressed={filtro === opcao}
          className={cn(filtro === opcao && 'font-semibold')}
          onClick={() => setParams({ filtro: opcao === 'todos' ? null : opcao })}
        >
          {opcao === 'todos' ? 'Todas' : COMPRA_STATUS_LABEL[opcao]}
        </Button>
      ))}
    </div>
  )
}
