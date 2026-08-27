'use client'

import { PersonAvatar } from '@repo/ui/components/person-avatar'
import { cn } from '@repo/ui/lib/utils'

import { formatCurrencyBRL } from '@/lib/formatters'
import type { FuncionarioConsumo } from '../lib/types'

export function FuncionarioPicker({
  funcionarios,
  selecionadoId,
  onSelecionar,
}: {
  funcionarios: FuncionarioConsumo[]
  selecionadoId: string | null
  onSelecionar: (id: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {funcionarios.map((funcionario) => {
        const selecionado = funcionario.id === selecionadoId
        return (
          <button
            key={funcionario.id}
            type="button"
            onClick={() => onSelecionar(funcionario.id)}
            aria-pressed={selecionado}
            className={cn(
              'flex w-28 cursor-pointer flex-col items-center gap-1.5 rounded-xl bg-card p-3 text-center shadow transition-colors hover:bg-accent/50',
              selecionado && 'ring-2 ring-primary'
            )}
          >
            <PersonAvatar name={funcionario.nome} className="size-10" />
            <span className="line-clamp-1 text-sm font-medium">
              {funcionario.nome}
            </span>
            <span
              className={cn(
                'text-xs tabular-nums',
                funcionario.totalPendente > 0
                  ? 'font-medium text-amber-600 dark:text-amber-400'
                  : 'text-muted-foreground'
              )}
            >
              {funcionario.totalPendente > 0
                ? formatCurrencyBRL(funcionario.totalPendente)
                : '—'}
            </span>
          </button>
        )
      })}
    </div>
  )
}
