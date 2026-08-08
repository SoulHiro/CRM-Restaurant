'use client'

import { Button } from '@repo/ui/components/button'
import { cn } from '@repo/ui/lib/utils'

import { useQueryParams } from '@/hooks/use-query-params'
import { CONTA_FILTROS, type ContaFiltro } from '../../lib/conta-helpers'

const LABELS: Record<ContaFiltro, string> = {
  todas: 'Todas',
  pendente: 'Em aberto',
  atrasado: 'Atrasadas',
  pago: 'Quitadas',
}

export function ContasFiltro({ filtro }: { filtro: ContaFiltro }) {
  const { setParams } = useQueryParams()

  return (
    <div className="flex flex-wrap gap-1" role="group" aria-label="Filtrar contas">
      {CONTA_FILTROS.map((opcao) => (
        <Button
          key={opcao}
          size="sm"
          variant={filtro === opcao ? 'secondary' : 'ghost'}
          aria-pressed={filtro === opcao}
          className={cn(filtro === opcao && 'font-semibold')}
          onClick={() =>
            setParams({ filtro: opcao === 'todas' ? null : opcao })
          }
        >
          {LABELS[opcao]}
        </Button>
      ))}
    </div>
  )
}
