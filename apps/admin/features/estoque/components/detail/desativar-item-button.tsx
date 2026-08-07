'use client'

import { PackageCheck, PackageMinus } from 'lucide-react'
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

import { toggleEstoqueItemAtivoAction } from '../../lib/actions'
import type { EstoqueItem } from '../../lib/types'

export function DesativarItemButton({ item }: { item: EstoqueItem }) {
  const { execute, isExecuting } = useAction(toggleEstoqueItemAtivoAction, {
    onSuccess: () => {
      toast.success(item.ativo ? 'Item desativado' : 'Item reativado')
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? 'Não foi possível alterar o item')
    },
  })

  if (!item.ativo) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-full sm:w-auto"
        disabled={isExecuting}
        onClick={() => execute({ id: item.id, ativo: true })}
      >
        <PackageCheck className="size-4" />
        Reativar
      </Button>
    )
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
          disabled={isExecuting}
        >
          <PackageMinus className="size-4" />
          Desativar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Desativar {item.nome}?</AlertDialogTitle>
          <AlertDialogDescription>
            Ele sai da lista e das contagens de inventário, mas o histórico de
            movimentação continua aqui. Dá para reativar depois.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => execute({ id: item.id, ativo: false })}
          >
            Desativar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
