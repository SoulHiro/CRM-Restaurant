'use client'

import { Printer, Trash2 } from 'lucide-react'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@repo/ui/components/alert-dialog'
import { Badge } from '@repo/ui/components/badge'
import { Button } from '@repo/ui/components/button'
import { cn } from '@repo/ui/lib/utils'

import { removerPedidoAction } from '../../../../lib/actions'
import type { PedidoDoDiaItem } from '../../../../lib/types'

const TURNO_LABEL: Record<'almoco' | 'jantar', string> = {
  almoco: 'Almoço',
  jantar: 'Jantar',
}

export function PedidoDiaRow({
  pedido,
  data,
  onImprimir,
  onRemovido,
}: {
  pedido: PedidoDoDiaItem
  data: string
  onImprimir: () => void
  onRemovido: () => void
}) {
  const semPedido = !pedido.prato && !pedido.recusou

  const { execute, isExecuting } = useAction(removerPedidoAction, {
    onSuccess: () => {
      toast.success('Pedido removido')
      onRemovido()
    },
    onError: () => toast.error('Não foi possível remover o pedido'),
  })

  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-lg bg-card p-4 sm:flex-row sm:items-center sm:justify-between',
        (pedido.recusou || semPedido) && 'opacity-60'
      )}
    >
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-medium">{pedido.nome}</span>
        <span className="truncate text-sm text-muted-foreground">
          {pedido.recusou
            ? 'Não vai retirar hoje'
            : semPedido
              ? 'Sem pedido importado para hoje'
              : pedido.prato}
          {pedido.tamanho && !semPedido && !pedido.recusou
            ? ` · ${pedido.tamanho}`
            : ''}
        </span>
        {pedido.observacao && (
          <span className="truncate text-xs text-muted-foreground">
            Obs: {pedido.observacao}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {pedido.turno && (
          <Badge variant="secondary" className="font-semibold">
            {TURNO_LABEL[pedido.turno]}
          </Badge>
        )}
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Imprimir comanda de ${pedido.nome}`}
          disabled={semPedido || pedido.recusou}
          onClick={onImprimir}
        >
          <Printer className="size-4" />
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Remover pedido de ${pedido.nome}`}
              disabled={semPedido || isExecuting}
            >
              <Trash2 className="size-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover pedido?</AlertDialogTitle>
              <AlertDialogDescription>
                O pedido de {pedido.nome} pra esse dia será removido. O
                colaborador continua cadastrado — só o pedido some. Essa ação
                não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  execute({ colaboradorId: pedido.colaboradorId, data })
                }
              >
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
