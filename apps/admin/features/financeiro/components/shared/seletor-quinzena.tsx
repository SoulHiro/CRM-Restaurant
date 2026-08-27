'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@repo/ui/components/button'

import { useQueryParams } from '@/hooks/use-query-params'
import {
  formatDataPagamento,
  formatQuinzena,
  quinzenaAnterior,
  quinzenaParaChave,
  quinzenaSeguinte,
  type Quinzena,
} from '../../lib/quinzena-helpers'

export function SeletorQuinzena({ quinzena }: { quinzena: Quinzena }) {
  const { setParams } = useQueryParams()

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        aria-label="Quinzena anterior"
        onClick={() =>
          setParams({ quinzena: quinzenaParaChave(quinzenaAnterior(quinzena)) })
        }
      >
        <ChevronLeft className="size-4" />
      </Button>
      <div className="flex flex-col items-center">
        <span className="min-w-32 text-center text-sm font-medium tabular-nums">
          {formatQuinzena(quinzena)}
        </span>
        <span className="text-[11px] text-muted-foreground">
          vence {formatDataPagamento(quinzena)}
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        aria-label="Próxima quinzena"
        onClick={() =>
          setParams({ quinzena: quinzenaParaChave(quinzenaSeguinte(quinzena)) })
        }
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  )
}
