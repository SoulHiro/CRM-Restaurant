'use client'

import { useState } from 'react'
import { cn } from '@repo/ui/lib/utils'

import { formatarCentavosBRL } from '../../lib/dinheiro'
import type { ComandaView } from '../../lib/types'
import { AbrirComandaDialog } from './abrir-comanda-dialog'

export function GradeComandas({
  quantidadeComandas,
  comandas,
  onSelecionar,
}: {
  quantidadeComandas: number
  comandas: ComandaView[]
  onSelecionar: (comandaId: string) => void
}) {
  const [numeroParaAbrir, setNumeroParaAbrir] = useState<number | null>(null)
  const porNumero = new Map(comandas.map((c) => [c.numero, c]))

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold">Salão</h1>
        <p className="text-sm text-muted-foreground">
          Toque num número livre pra abrir uma comanda, ou numa já aberta pra continuar
          lançando.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
        {Array.from({ length: quantidadeComandas }, (_, i) => i + 1).map((numero) => {
          const aberta = porNumero.get(numero)
          return (
            <button
              key={numero}
              type="button"
              onClick={() =>
                aberta ? onSelecionar(aberta.id) : setNumeroParaAbrir(numero)
              }
              className={cn(
                'flex aspect-square flex-col items-center justify-center rounded-md border text-sm font-medium transition-colors',
                aberta
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-100'
                  : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted'
              )}
            >
              <span>{numero}</span>
              {aberta && (
                <span className="text-[10px] font-normal">
                  {formatarCentavosBRL(aberta.totalCentavos)}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <AbrirComandaDialog
        numero={numeroParaAbrir}
        open={numeroParaAbrir != null}
        onOpenChange={(open) => !open && setNumeroParaAbrir(null)}
        onAberta={onSelecionar}
      />
    </div>
  )
}
