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
import { cn } from '@repo/ui/lib/utils'

import { formatDateBR } from '@/lib/formatters'
import { deletePausaAction } from '../../../../lib/actions'
import type { EmpresaPausa } from '../../../../lib/types'

export function PausaRow({
  pausa,
  className,
}: {
  pausa: EmpresaPausa
  className: string
}) {
  const { execute, isExecuting } = useAction(deletePausaAction, {
    onSuccess: () => {
      toast.success('Pausa removida')
    },
    onError: () => {
      toast.error('Não foi possível remover a pausa')
    },
  })

  return (
    <div role="row" className={cn('rounded-lg bg-card', className)}>
      <span role="cell" className="font-medium">
        {formatDateBR(pausa.data)}
      </span>
      <span role="cell" className="text-muted-foreground">
        {pausa.motivo ?? '—'}
      </span>
      <span role="cell" className="flex justify-end">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Remover pausa"
              disabled={isExecuting}
            >
              <Trash2 className="size-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover pausa?</AlertDialogTitle>
              <AlertDialogDescription>
                A pausa de {formatDateBR(pausa.data)}
                {pausa.motivo ? ` (${pausa.motivo})` : ''} será removida. Essa
                ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => execute({ id: pausa.id })}>
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </span>
    </div>
  )
}
