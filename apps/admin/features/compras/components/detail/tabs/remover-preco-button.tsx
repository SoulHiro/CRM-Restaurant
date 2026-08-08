'use client'

import { Trash2 } from 'lucide-react'
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

import { deleteFornecedorItemAction } from '../../../lib/actions'

export function RemoverPrecoButton({
  id,
  itemNome,
}: {
  id: string
  itemNome: string
}) {
  const remover = useAction(deleteFornecedorItemAction, {
    onSuccess: () => toast.success('Preço removido'),
    onError: ({ error }) =>
      toast.error(error.serverError ?? 'Não foi possível remover'),
  })

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Remover preço de ${itemNome}`}
          disabled={remover.isExecuting}
        >
          <Trash2 className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover o preço de {itemNome}?</AlertDialogTitle>
          <AlertDialogDescription>
            As compras já registradas não mudam — só some da comparação de preço
            deste fornecedor.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={() => remover.execute({ id })}>
            Remover
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
