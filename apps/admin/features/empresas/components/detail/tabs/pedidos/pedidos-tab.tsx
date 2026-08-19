'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAction } from 'next-safe-action/hooks'
import { Printer, Search } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@repo/ui/components/button'
import { EmptyState } from '@repo/ui/components/empty-state'
import { Input } from '@repo/ui/components/input'
import { Skeleton } from '@repo/ui/components/skeleton'

import { hojeISO } from '@/lib/formatters'
import { listarPedidosDoDiaAction } from '../../../../lib/actions'
import type { PedidoDoDiaItem } from '../../../../lib/types'
import {
  useImprimirComandas,
  type ComandaEntrada,
} from '../../../../hooks/use-imprimir-comandas'
import { AdicionarPedidoManualDrawer } from './form/adicionar-pedido-manual-drawer'
import { CompararConferenciaDrawer } from './form/comparar-conferencia-drawer'
import { ImportarPlanilhaDrawer } from './form/importar-planilha-drawer'
import { FinalizarDiaDrawer } from './finalizar-dia-drawer'
import { PedidoDiaRow } from './pedido-dia-row'
import { PedidosInsights } from './pedidos-insights'

function paraComanda(
  pedido: PedidoDoDiaItem,
  empresaNome: string
): ComandaEntrada {
  return {
    nome: pedido.nome,
    empresaNome,
    turno: pedido.turno,
    tamanho: pedido.tamanho,
    prato: pedido.prato,
    observacao: pedido.observacao,
    respondidoEm: pedido.respondidoEm,
  }
}

export function PedidosTab({
  empresaId,
  empresaNome,
}: {
  empresaId: string
  empresaNome: string
}) {
  const [data, setData] = useState(hojeISO())
  const [pedidos, setPedidos] = useState<PedidoDoDiaItem[] | null>(null)
  const [busca, setBusca] = useState('')
  const { imprimir, imprimindo } = useImprimirComandas()

  const pedidosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return pedidos
    return (pedidos ?? []).filter((p) => p.nome.toLowerCase().includes(termo))
  }, [pedidos, busca])

  const { execute, isExecuting } = useAction(listarPedidosDoDiaAction, {
    onSuccess: ({ data: resultado }) => setPedidos(resultado?.pedidos ?? []),
    onError: () => {
      toast.error('Não foi possível carregar os pedidos do dia.')
      setPedidos([])
    },
  })

  useEffect(() => {
    execute({ empresaId, data })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId, data])

  const comImprimivel = (pedidos ?? []).filter(
    (p) => p.prato && !p.recusou
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={data}
            onChange={(event) => setData(event.target.value)}
            className="w-44"
          />
          <div className="relative w-56">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar pessoa..."
              className="pl-8"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={imprimindo || comImprimivel.length === 0}
            onClick={() =>
              imprimir(comImprimivel.map((p) => paraComanda(p, empresaNome)))
            }
          >
            <Printer className="size-4" />
            Imprimir todos ({comImprimivel.length})
          </Button>
          <AdicionarPedidoManualDrawer
            empresaId={empresaId}
            data={data}
            onAdicionado={() => execute({ empresaId, data })}
          />
          <ImportarPlanilhaDrawer empresaId={empresaId} />
          <CompararConferenciaDrawer pedidos={pedidos ?? []} />
          <FinalizarDiaDrawer
            empresaId={empresaId}
            empresaNome={empresaNome}
            data={data}
            pedidos={pedidos ?? []}
            onFinalizado={() => execute({ empresaId, data })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr] lg:items-start">
        <PedidosInsights pedidos={pedidos ?? []} />

        <div className="flex flex-col gap-4">
          {isExecuting && !pedidos ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : !pedidos || pedidos.length === 0 ? (
            <EmptyState
              message={`Nenhum colaborador importado para ${empresaNome} ainda.`}
            />
          ) : !pedidosFiltrados || pedidosFiltrados.length === 0 ? (
            <EmptyState message={`Nenhuma pessoa encontrada para "${busca}".`} />
          ) : (
            <div className="flex flex-col gap-2">
              {pedidosFiltrados.map((pedido) => (
                <PedidoDiaRow
                  key={pedido.colaboradorId}
                  pedido={pedido}
                  data={data}
                  onImprimir={() => imprimir([paraComanda(pedido, empresaNome)])}
                  onRemovido={() => execute({ empresaId, data })}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
