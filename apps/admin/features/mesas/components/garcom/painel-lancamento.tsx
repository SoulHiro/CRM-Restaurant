'use client'

import { useAction } from 'next-safe-action/hooks'
import { ArrowLeft, Send } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@repo/ui/components/button'

import { useImprimirCozinha } from '../../hooks/use-imprimir-cozinha'
import { enviarCozinhaAction, lancarItemAction } from '../../lib/actions'
import { formatarCentavosBRL } from '../../lib/dinheiro'
import type { ComandaView, ProdutoLancamento } from '../../lib/types'
import { ItemLancadoRow } from './item-lancado-row'
import { SeletorProduto } from './seletor-produto'

export function PainelLancamento({
  comanda,
  produtos,
  onVoltar,
}: {
  comanda: ComandaView
  produtos: ProdutoLancamento[]
  onVoltar: () => void
}) {
  const { imprimirCozinha, imprimindo, dialog } = useImprimirCozinha()

  const { execute: lancar } = useAction(lancarItemAction, {
    onError: ({ error }) =>
      toast.error(error.serverError ?? 'Não foi possível lançar o item.'),
  })

  const { execute: enviarCozinha, isPending: enviando } = useAction(enviarCozinhaAction, {
    onSuccess: ({ data }) => {
      if (!data) return
      if (data.itens.length === 0) {
        toast.info('Nenhum item novo pra enviar.')
        return
      }
      void imprimirCozinha(data)
    },
    onError: ({ error }) =>
      toast.error(error.serverError ?? 'Não foi possível enviar pra cozinha.'),
  })

  return (
    <div className="flex h-full flex-col gap-4 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onVoltar}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">Comanda #{comanda.numero}</h1>
          {comanda.mesaLabel && (
            <p className="text-sm text-muted-foreground">{comanda.mesaLabel}</p>
          )}
        </div>
        <Button
          variant="outline"
          disabled={enviando || imprimindo}
          onClick={() => enviarCozinha({ comandaId: comanda.id })}
        >
          <Send className="size-4" />
          Enviar pra cozinha
        </Button>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-2">
        <div className="overflow-y-auto rounded-md border p-3">
          <SeletorProduto
            produtos={produtos}
            onLancar={(produtoId, produtoTamanhoId) =>
              lancar({
                comandaId: comanda.id,
                produtoId,
                produtoTamanhoId,
                quantidade: 1,
              })
            }
          />
        </div>

        <div className="flex flex-col gap-2 overflow-y-auto">
          {comanda.itens.length === 0 && (
            <p className="p-3 text-sm text-muted-foreground">
              Nenhum item lançado ainda.
            </p>
          )}
          {comanda.itens.map((item) => (
            <ItemLancadoRow key={item.id} item={item} />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between border-t pt-3 text-lg font-semibold">
        <span>Total</span>
        <span>{formatarCentavosBRL(comanda.totalCentavos)}</span>
      </div>

      {dialog}
    </div>
  )
}
