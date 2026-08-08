'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@repo/ui/components/button'

import { useQueryParams } from '@/hooks/use-query-params'
import { formatMes, mesAnterior, mesSeguinte } from '../../lib/dre-helpers'

export function MesSelector({ mes }: { mes: string }) {
  const { setParams } = useQueryParams()

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon"
        aria-label="Mês anterior"
        onClick={() => setParams({ mes: mesAnterior(mes) })}
      >
        <ChevronLeft className="size-4" />
      </Button>

      <span className="min-w-[10rem] text-center text-sm font-medium">
        {formatMes(mes)}
      </span>

      <Button
        variant="outline"
        size="icon"
        aria-label="Próximo mês"
        onClick={() => setParams({ mes: mesSeguinte(mes) })}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  )
}
