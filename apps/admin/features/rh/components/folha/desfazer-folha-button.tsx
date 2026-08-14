'use client'

import { Undo2 } from 'lucide-react'
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

import { desfazerFolhaAction } from '../../lib/actions'
import { rotuloCompetencia } from '../../lib/folha-helpers'

export function DesfazerFolhaButton({
  competencia,
  qtdLinhas,
  temContaPaga,
}: {
  competencia: string
  qtdLinhas: number
  temContaPaga: boolean
}) {
  const desfazer = useAction(desfazerFolhaAction, {
    onSuccess: () => toast.success('Folha desfeita — as contas sumiram junto'),
    onError: ({ error }) =>
      toast.error(error.serverError ?? 'Não foi possível desfazer'),
  })

  if (temContaPaga) {
    return (
      <p className="text-xs text-muted-foreground sm:max-w-[18rem] sm:text-right">
        Alguma conta desta folha já foi paga, então ela não pode mais ser
        desfeita.
      </p>
    )
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
          disabled={desfazer.isExecuting}
        >
          <Undo2 className="size-4" />
          Desfazer folha
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Desfazer a folha de {rotuloCompetencia(competencia)}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {qtdLinhas === 1
              ? 'A conta gerada'
              : `As ${qtdLinhas} contas geradas`}{' '}
            no financeiro {qtdLinhas === 1 ? 'é apagada' : 'são apagadas'}, e o
            mês volta a poder ser fechado.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={() => desfazer.execute({ competencia })}>
            Desfazer folha
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
