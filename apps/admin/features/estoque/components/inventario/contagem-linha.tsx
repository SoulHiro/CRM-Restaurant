'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, LoaderCircle } from 'lucide-react'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'

import { Input } from '@repo/ui/components/input'
import { cn } from '@repo/ui/lib/utils'

import { salvarContagemAction } from '../../lib/actions'
import { calcularDiferenca } from '../../lib/inventario-helpers'
import type { InventarioLinha } from '../../lib/types'
import { MobileCellLabel } from '@repo/ui/components/mobile-cell-label'
import { formatQuantidade, Quantidade } from '../shared/quantidade'

function toInputValue(valor: number | null): string {
  return valor == null ? '' : String(valor)
}

export function ContagemLinha({
  linha,
  className,
  inventarioId,
}: {
  linha: InventarioLinha
  className: string
  inventarioId: string
}) {
  const [valor, setValor] = useState(toInputValue(linha.quantidadeContada))
  const [salvo, setSalvo] = useState(false)
  const ultimoSalvoRef = useRef(toInputValue(linha.quantidadeContada))

  const { execute, isExecuting } = useAction(salvarContagemAction, {
    onSuccess: () => {
      setSalvo(true)
    },
    onError: ({ error }) => {
      setValor(ultimoSalvoRef.current)
      toast.error(error.serverError ?? 'Não foi possível salvar a contagem')
    },
  })

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (valor === ultimoSalvoRef.current) return
      ultimoSalvoRef.current = valor
      setSalvo(false)
      execute({
        linhaId: linha.id,
        inventarioId,
        quantidadeContada: valor === '' ? '' : Number(valor),
      })
    }, 600)

    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor])

  useEffect(() => {
    if (!salvo) return
    const timeout = setTimeout(() => setSalvo(false), 1600)
    return () => clearTimeout(timeout)
  }, [salvo])

  const contadaLocal = valor === '' ? null : Number(valor)
  const diferenca =
    contadaLocal == null || Number.isNaN(contadaLocal)
      ? null
      : calcularDiferenca(contadaLocal, linha.quantidadeSistema)

  const statusIcon = isExecuting ? (
    <LoaderCircle
      className="size-4 animate-spin text-muted-foreground"
      aria-label="Salvando"
    />
  ) : salvo ? (
    <Check
      className="size-4 text-emerald-600 dark:text-emerald-400"
      aria-label="Salvo"
    />
  ) : null

  return (
    <div role="row" className={cn('rounded-lg bg-card', className)}>
      <span role="cell" className="min-w-0">
        <span className="block truncate font-medium">{linha.itemNome}</span>
      </span>

      <span
        role="cell"
        className="flex items-center justify-between gap-2 text-sm text-muted-foreground sm:block sm:text-right"
      >
        <MobileCellLabel>Sistema</MobileCellLabel>
        <Quantidade
          valor={linha.quantidadeSistema}
          unidade={linha.unidade}
          className="tabular-nums"
        />
      </span>

      <span role="cell" className="flex flex-col gap-1">
        <MobileCellLabel>Contado</MobileCellLabel>
        <span className="flex items-center gap-2">
          <Input
            type="number"
            step="0.001"
            min="0"
            inputMode="decimal"
            className="h-11 w-full text-right tabular-nums sm:h-9 sm:w-28"
            aria-label={`Quantidade contada de ${linha.itemNome}`}
            placeholder="—"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
          />
          <span className="w-4 shrink-0">{statusIcon}</span>
        </span>
      </span>

      <span
        role="cell"
        className={cn(
          'flex items-center justify-between gap-2 text-sm font-medium tabular-nums sm:block sm:text-right',
          diferenca == null && 'text-muted-foreground',
          diferenca != null && diferenca < 0 && 'text-destructive',
          diferenca != null &&
            diferenca > 0 &&
            'text-emerald-600 dark:text-emerald-400',
          diferenca === 0 && 'text-muted-foreground'
        )}
      >
        <MobileCellLabel>Diferença</MobileCellLabel>
        {diferenca == null
          ? 'Não contado'
          : diferenca === 0
            ? 'Bateu'
            : `${diferenca > 0 ? '+' : ''}${formatQuantidade(diferenca)}`}
      </span>
    </div>
  )
}
