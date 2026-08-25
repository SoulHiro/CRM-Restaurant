'use client'

import { cn } from '@repo/ui/lib/utils'

const DIAS_LETRA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const DIAS_LABEL = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
]

/** Dias da semana em que o produto normalmente entra no cardápio. Vazio = todo dia. */
export function DiaSemanaPicker({
  value,
  onChange,
}: {
  value: number[]
  onChange: (value: number[]) => void
}) {
  function toggle(dia: number) {
    onChange(
      value.includes(dia)
        ? value.filter((d) => d !== dia)
        : [...value, dia].sort((a, b) => a - b)
    )
  }

  return (
    <div className="flex gap-2">
      {DIAS_LETRA.map((letra, dia) => {
        const ativo = value.includes(dia)
        return (
          <button
            key={dia}
            type="button"
            onClick={() => toggle(dia)}
            aria-pressed={ativo}
            aria-label={DIAS_LABEL[dia]}
            title={DIAS_LABEL[dia]}
            className={cn(
              'flex size-9 cursor-pointer items-center justify-center rounded-full border text-xs font-medium transition-colors',
              ativo
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-input bg-transparent text-muted-foreground hover:bg-accent'
            )}
          >
            {letra}
          </button>
        )
      })}
    </div>
  )
}
