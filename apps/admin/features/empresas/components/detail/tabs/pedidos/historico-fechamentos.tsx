'use client'

import { useEffect, useState } from 'react'
import { useAction } from 'next-safe-action/hooks'
import { ChevronDown } from 'lucide-react'

import { formatDateBR } from '@/lib/formatters'
import { listarFechamentosAction } from '../../../../lib/actions'
import type { FechamentoDia } from '../../../../lib/types'

export function HistoricoFechamentos({
  empresaId,
  recarregarQuando,
}: {
  empresaId: string
  recarregarQuando: number
}) {
  const [aberto, setAberto] = useState(false)
  const [fechamentos, setFechamentos] = useState<FechamentoDia[] | null>(null)

  const { execute } = useAction(listarFechamentosAction, {
    onSuccess: ({ data }) => setFechamentos(data?.fechamentos ?? []),
  })

  useEffect(() => {
    if (aberto) execute({ empresaId })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto, empresaId, recarregarQuando])

  return (
    <div className="rounded-lg bg-card">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="flex w-full cursor-pointer items-center justify-between gap-2 p-4 text-left"
      >
        <span className="text-sm font-medium">Histórico de fechamentos</span>
        <ChevronDown
          className={`size-4 text-muted-foreground transition-transform ${aberto ? 'rotate-180' : ''}`}
        />
      </button>

      {aberto && (
        <div className="flex flex-col gap-2 px-4 pb-4">
          {!fechamentos ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : fechamentos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum dia finalizado ainda.
            </p>
          ) : (
            fechamentos.map((f) => (
              <div
                key={f.data}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted px-3 py-2.5 text-sm"
              >
                <span className="font-medium">{formatDateBR(f.data)}</span>
                <span className="text-muted-foreground">
                  P {f.quantidadeP} · M {f.quantidadeM} · G {f.quantidadeG}
                  {' · '}
                  Café {f.quantidadeCafe} · Suco {f.quantidadeSuco} · Lanche{' '}
                  {f.quantidadeLanche}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
