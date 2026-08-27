'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@repo/ui/components/button'

import { useQueryParams } from '@/hooks/use-query-params'
import {
  formatJornada,
  jornadaAnterior,
  jornadaSeguinte,
  type Jornada,
} from '../../lib/jornada-helpers'

export function SeletorJornada({ jornada }: { jornada: Jornada }) {
  const { setParams } = useQueryParams()

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        aria-label="Jornada anterior"
        onClick={() =>
          setParams({ jornada: jornadaAnterior(jornada.inicio) })
        }
      >
        <ChevronLeft className="size-4" />
      </Button>
      <span className="min-w-40 text-center text-sm font-medium tabular-nums">
        {formatJornada(jornada)}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        aria-label="Próxima jornada"
        onClick={() =>
          setParams({ jornada: jornadaSeguinte(jornada.inicio) })
        }
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  )
}
