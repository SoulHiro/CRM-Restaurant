'use client'

import { useState } from 'react'
import { useAction } from 'next-safe-action/hooks'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@repo/ui/components/button'
import { Input } from '@repo/ui/components/input'

import { editarItemAction, excluirItemAction } from '../../lib/actions'
import { formatarCentavosBRL } from '../../lib/dinheiro'
import type { ComandaItemView } from '../../lib/types'

export function ItemLancadoRow({ item }: { item: ComandaItemView }) {
  const [observacao, setObservacao] = useState(item.observacao ?? '')

  const { execute: editar, isPending: editando } = useAction(editarItemAction, {
    onError: ({ error }) =>
      toast.error(error.serverError ?? 'Não foi possível editar o item.'),
  })
  const { execute: excluir, isPending: excluindo } = useAction(excluirItemAction, {
    onError: ({ error }) =>
      toast.error(error.serverError ?? 'Não foi possível excluir o item.'),
  })

  function ajustarQuantidade(delta: number) {
    const nova = item.quantidade + delta
    if (nova <= 0) {
      excluir({ comandaItemId: item.id })
      return
    }
    editar({ comandaItemId: item.id, quantidade: nova })
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {item.produtoNome}
            {item.produtoTamanhoNome && ` (${item.produtoTamanhoNome})`}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatarCentavosBRL(item.precoUnitarioCentavos)} cada
          </p>
        </div>
        <p className="shrink-0 text-sm font-semibold">
          {formatarCentavosBRL(item.totalCentavos)}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="size-7"
          disabled={editando || excluindo}
          onClick={() => ajustarQuantidade(-1)}
        >
          <Minus className="size-3.5" />
        </Button>
        <span className="w-6 text-center text-sm">{item.quantidade}</span>
        <Button
          variant="outline"
          size="icon"
          className="size-7"
          disabled={editando || excluindo}
          onClick={() => ajustarQuantidade(1)}
        >
          <Plus className="size-3.5" />
        </Button>

        <Input
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          onBlur={() => {
            if (observacao !== (item.observacao ?? '')) {
              editar({ comandaItemId: item.id, observacao })
            }
          }}
          placeholder="Observação..."
          className="h-7 flex-1 text-xs"
        />

        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-destructive"
          disabled={editando || excluindo}
          onClick={() => excluir({ comandaItemId: item.id })}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      {item.enviadoCozinha && (
        <p className="text-[10px] text-muted-foreground">Já enviado pra cozinha</p>
      )}
    </div>
  )
}
