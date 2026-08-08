'use client'

import { X } from 'lucide-react'
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

import { cancelarCompraAction } from '../../lib/actions'
import type { CompraStatus } from '../../lib/types'

export function CancelarCompraButton({
  id,
  status,
}: {
  id: string
  status: CompraStatus
}) {
  const cancelar = useAction(cancelarCompraAction, {
    onSuccess: () =>
      toast.success('Compra cancelada — a conta a pagar sumiu junto'),
    onError: ({ error }) =>
      toast.error(error.serverError ?? 'Não foi possível cancelar'),
  })

  if (status !== 'pedido_feito' && status !== 'aguardando_entrega') return null

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Cancelar compra"
          disabled={cancelar.isExecuting}
        >
          <X className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancelar essa compra?</AlertDialogTitle>
          <AlertDialogDescription>
            A conta a pagar que ela gerou é apagada junto. Nada entra no estoque.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Voltar</AlertDialogCancel>
          <AlertDialogAction onClick={() => cancelar.execute({ id })}>
            Cancelar compra
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
