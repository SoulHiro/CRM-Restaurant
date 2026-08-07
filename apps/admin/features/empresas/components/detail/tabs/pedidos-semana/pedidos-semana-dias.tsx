'use client'

import { Button } from '@repo/ui/components/button'
import { cn } from '@repo/ui/lib/utils'

import type { DiaOption } from '../../../../lib/pedidos-semana-helpers'

export function PedidosSemanaDias({
  dias,
  selecionado,
  hoje,
  onSelect,
}: {
  dias: DiaOption[]
  selecionado: string | null
  hoje: string
  onSelect: (dia: string) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {dias.map((dia) => (
        <Button
          key={dia.dia}
          type="button"
          size="sm"
          variant={selecionado === dia.dia ? 'secondary' : 'outline'}
          onClick={() => onSelect(dia.dia)}
          className={cn(
            dia.dia === hoje && selecionado !== dia.dia && 'border-primary'
          )}
        >
          {dia.diaSemanaLabel.slice(0, 3)}
          {dia.dia === hoje && (
            <span className="ml-1 size-1.5 rounded-full bg-primary" />
          )}
        </Button>
      ))}
    </div>
  )
}
