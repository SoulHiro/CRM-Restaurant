'use client'

import { CalendarIcon, X } from 'lucide-react'
import type { DateRange } from 'react-day-picker'

import { Button } from '@repo/ui/components/button'
import { Calendar } from '@repo/ui/components/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@repo/ui/components/popover'

import { getFimSemanaAtualISO } from '../../../../lib/pedidos-semana-helpers'

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function parseISODate(value: string): Date {
  return new Date(`${value}T00:00:00`)
}

function formatLabel(from: string | null, to: string | null): string {
  if (!from) return 'Todo o período'

  const formatter = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  })
  const inicio = formatter.format(parseISODate(from))
  if (!to || to === from) return inicio

  const fim = formatter.format(parseISODate(to))
  return `${inicio} – ${fim}`
}

export function HistoricoDateRangePicker({
  from,
  to,
  onChange,
}: {
  from: string | null
  to: string | null
  onChange: (range: { from: string | null; to: string | null }) => void
}) {
  const selected: DateRange | undefined = from
    ? { from: parseISODate(from), to: to ? parseISODate(to) : undefined }
    : undefined
  const fimSemanaAtual = parseISODate(getFimSemanaAtualISO())

  return (
    <div className="flex items-center gap-1">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <CalendarIcon className="size-4" />
            {formatLabel(from, to)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={selected}
            disabled={{ after: fimSemanaAtual }}
            onSelect={(range) =>
              onChange({
                from: range?.from ? toISODate(range.from) : null,
                to: range?.to ? toISODate(range.to) : null,
              })
            }
          />
        </PopoverContent>
      </Popover>

      {from && (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Limpar filtro de data"
          onClick={() => onChange({ from: null, to: null })}
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  )
}
