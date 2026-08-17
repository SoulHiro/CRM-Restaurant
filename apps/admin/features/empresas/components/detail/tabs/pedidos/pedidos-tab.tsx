'use client'

import { useEffect, useState } from 'react'
import { useAction } from 'next-safe-action/hooks'
import { Printer } from 'lucide-react'
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
import { ImportarPlanilhaDrawer } from './form/importar-planilha-drawer'
import { FinalizarDiaDrawer } from './finalizar-dia-drawer'
import { HistoricoFechamentos } from './historico-fechamentos'
import { PedidoDiaRow } from './pedido-dia-row'

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
  const [versaoHistorico, setVersaoHistorico] = useState(0)
  const { imprimir, imprimindo } = useImprimirComandas()

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
        <Input
          type="date"
          value={data}
          onChange={(event) => setData(event.target.value)}
          className="w-44"
        />
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
          <FinalizarDiaDrawer
            empresaId={empresaId}
            empresaNome={empresaNome}
            data={data}
            pedidos={pedidos ?? []}
            onFinalizado={() => setVersaoHistorico((v) => v + 1)}
          />
        </div>
      </div>

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
      ) : (
        <div className="flex flex-col gap-2">
          {pedidos.map((pedido) => (
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

      <HistoricoFechamentos
        empresaId={empresaId}
        recarregarQuando={versaoHistorico}
      />
    </div>
  )
}
