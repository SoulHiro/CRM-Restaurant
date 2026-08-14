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

import { deleteCargoAction } from '../../lib/actions'
import type { Cargo } from '../../lib/types'

export function ExcluirCargoButton({ cargo }: { cargo: Cargo }) {
  const excluir = useAction(deleteCargoAction, {
    onSuccess: () => toast.success('Cargo excluído'),
    onError: ({ error }) =>
      toast.error(error.serverError ?? 'Não foi possível excluir'),
  })

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Excluir cargo ${cargo.nome}`}
          disabled={excluir.isExecuting || cargo.ocupantes > 0}
        >
          <Trash2 className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir o cargo {cargo.nome}?</AlertDialogTitle>
          <AlertDialogDescription>
            Some da lista de cargos. Só é possível porque ninguém está nele.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={() => excluir.execute({ id: cargo.id })}>
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
