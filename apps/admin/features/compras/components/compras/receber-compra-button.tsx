'use client'

import { PackageCheck } from 'lucide-react'
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
import { Button } from '@repo/ui/components/button'

import { receberCompraAction } from '../../lib/actions'
import type { CompraStatus } from '../../lib/types'

/**
 * Receber pede confirmação porque é irreversível: gera movimento de entrada
 * com saldo encadeado, e desfazer faria todo movimento posterior daquele item
 * mentir. Depois disso a correção é pelo ajuste de quantidade, no estoque.
 */
export function ReceberCompraButton({
  id,
  status,
  qtdItens,
  hoje,
}: {
  id: string
  status: CompraStatus
  qtdItens: number
  hoje: string
}) {
  const receber = useAction(receberCompraAction, {
    onSuccess: ({ data }) => {
      const recebidos = data?.itensRecebidos ?? qtdItens
      toast.success(
        `Recebido — ${recebidos} ${recebidos === 1 ? 'item entrou' : 'itens entraram'} no estoque`
      )
    },
    onError: ({ error }) =>
      toast.error(error.serverError ?? 'Não foi possível receber'),
  })

  if (status !== 'pedido_feito' && status !== 'aguardando_entrega') return null

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          size="sm"
          className="w-full sm:w-auto"
          disabled={receber.isExecuting}
        >
          <PackageCheck className="size-4" />
          Recebi
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar o recebimento?</AlertDialogTitle>
          <AlertDialogDescription>
            {qtdItens === 1 ? 'O item entra' : `Os ${qtdItens} itens entram`} no
            estoque agora e o preço pago vai para o histórico. Depois disso não
            dá para desfazer — a correção passa a ser pelo ajuste de quantidade
            do item.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Ainda não chegou</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => receber.execute({ id, dataRecebimento: hoje })}
          >
            Recebi tudo
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
