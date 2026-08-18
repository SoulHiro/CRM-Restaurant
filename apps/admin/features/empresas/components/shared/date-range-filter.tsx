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

import { dataISO, hojeISO } from '@/lib/formatters'

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function parseISODate(value: string): Date {
  return new Date(`${value}T00:00:00`)
}

function diasAtras(dias: number): string {
  return dataISO(new Date(Date.now() - dias * 24 * 60 * 60 * 1000))
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

export interface DateRangeValue {
  from: string | null
  to: string | null
}

const ATALHOS: { label: string; intervalo: () => DateRangeValue }[] = [
  { label: 'Hoje', intervalo: () => ({ from: hojeISO(), to: hojeISO() }) },
  {
    label: 'Ontem',
    intervalo: () => ({ from: diasAtras(1), to: diasAtras(1) }),
  },
  {
    label: 'Últimos 7 dias',
    intervalo: () => ({ from: diasAtras(6), to: hojeISO() }),
  },
  {
    label: 'Último mês',
    intervalo: () => ({ from: diasAtras(29), to: hojeISO() }),
  },
  {
    label: 'Último ano',
    intervalo: () => ({ from: diasAtras(364), to: hojeISO() }),
  },
]

/**
 * Popover com calendário de intervalo (mesma base de
 * `historico-date-range-picker.tsx`) e uma coluna de atalhos ao lado — não
 * dentro do calendário, são irmãos no mesmo `PopoverContent`.
 */
export function DateRangeFilter({
  value,
  onChange,
}: {
  value: DateRangeValue
  onChange: (range: DateRangeValue) => void
}) {
  const selected: DateRange | undefined = value.from
    ? {
        from: parseISODate(value.from),
        to: value.to ? parseISODate(value.to) : undefined,
      }
    : undefined

  return (
    <div className="flex items-center gap-1">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <CalendarIcon className="size-4" />
            {formatLabel(value.from, value.to)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            <div className="flex flex-col gap-1 border-r p-2">
              {ATALHOS.map((atalho) => (
                <Button
                  key={atalho.label}
                  variant="ghost"
                  size="sm"
                  className="justify-start"
                  onClick={() => onChange(atalho.intervalo())}
                >
                  {atalho.label}
                </Button>
              ))}
            </div>
            <Calendar
              mode="range"
              selected={selected}
              onSelect={(range) =>
                onChange({
                  from: range?.from ? toISODate(range.from) : null,
                  to: range?.to ? toISODate(range.to) : null,
                })
              }
            />
          </div>
        </PopoverContent>
      </Popover>

      {value.from && (
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
