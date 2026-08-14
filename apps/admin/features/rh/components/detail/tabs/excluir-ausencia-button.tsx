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

import { formatDateBR } from '@/lib/formatters'
import { deleteAusenciaAction } from '../../../lib/actions'
import { AUSENCIA_LABELS } from '../../../lib/ausencia-helpers'
import type { Ausencia } from '../../../lib/types'

export function ExcluirAusenciaButton({ ausencia }: { ausencia: Ausencia }) {
  const excluir = useAction(deleteAusenciaAction, {
    onSuccess: () => toast.success('Ausência removida'),
    onError: ({ error }) =>
      toast.error(error.serverError ?? 'Não foi possível remover'),
  })

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Excluir ausência"
          disabled={excluir.isExecuting}
        >
          <Trash2 className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover essa ausência?</AlertDialogTitle>
          <AlertDialogDescription>
            {AUSENCIA_LABELS[ausencia.tipo]} de{' '}
            {formatDateBR(ausencia.dataInicio)}. As folhas já fechadas não
            mudam — só as próximas voltam a contar esses dias.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => excluir.execute({ id: ausencia.id })}
          >
            Remover
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
