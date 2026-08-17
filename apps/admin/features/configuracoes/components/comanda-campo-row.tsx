'use client'

import { ChevronDown, ChevronUp } from 'lucide-react'

import { Button } from '@repo/ui/components/button'
import { Checkbox } from '@repo/ui/components/checkbox'
import { cn } from '@repo/ui/lib/utils'

import { CAMPO_COMANDA_LABEL, type CampoComandaKey } from '../lib/types'

export function ComandaCampoRow({
  campo,
  ativo,
  podeSubir,
  podeDescer,
  onToggle,
  onSubir,
  onDescer,
}: {
  campo: CampoComandaKey
  ativo: boolean
  podeSubir: boolean
  podeDescer: boolean
  onToggle: () => void
  onSubir: () => void
  onDescer: () => void
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-lg bg-muted px-3 py-2.5 transition-opacity',
        !ativo && 'opacity-60'
      )}
    >
      <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
        <Checkbox
          checked={ativo}
          onCheckedChange={onToggle}
          aria-label={`Mostrar "${CAMPO_COMANDA_LABEL[campo]}" na comanda`}
        />
        <span className="truncate text-sm">{CAMPO_COMANDA_LABEL[campo]}</span>
      </label>

      <div className="flex shrink-0 gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7"
          disabled={!podeSubir}
          aria-label={`Mover "${CAMPO_COMANDA_LABEL[campo]}" pra cima`}
          onClick={onSubir}
        >
          <ChevronUp className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7"
          disabled={!podeDescer}
          aria-label={`Mover "${CAMPO_COMANDA_LABEL[campo]}" pra baixo`}
          onClick={onDescer}
        >
          <ChevronDown className="size-4" />
        </Button>
      </div>
    </div>
  )
}
