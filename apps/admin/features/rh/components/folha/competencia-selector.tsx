'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@repo/ui/components/button'

import { useQueryParams } from '@/hooks/use-query-params'
import { rotuloCompetencia } from '../../lib/folha-helpers'

function deslocar(competencia: string, meses: number): string {
  const [ano, mes] = competencia.split('-').map(Number)
  if (!ano || !mes) return competencia
  return new Date(Date.UTC(ano, mes - 1 + meses, 1)).toISOString().slice(0, 7)
}

export function CompetenciaSelector({ competencia }: { competencia: string }) {
  const { setParams } = useQueryParams()

  return (
    <div className="flex items-center justify-between gap-2 sm:justify-start">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Mês anterior"
        onClick={() => setParams({ competencia: deslocar(competencia, -1) })}
      >
        <ChevronLeft className="size-4" />
      </Button>

      <span className="text-lg font-semibold first-letter:uppercase">
        {rotuloCompetencia(competencia)}
      </span>

      <Button
        variant="ghost"
        size="icon"
        aria-label="Próximo mês"
        onClick={() => setParams({ competencia: deslocar(competencia, 1) })}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  )
}
