'use client'

import { CheckCheck } from 'lucide-react'
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

import { finalizarInventarioAction } from '../../lib/actions'

export function FinalizarInventarioButton({
  inventarioId,
  linhasDivergentes,
  linhasPendentes,
}: {
  inventarioId: string
  linhasDivergentes: number
  linhasPendentes: number
}) {
  const { execute, isExecuting } = useAction(finalizarInventarioAction, {
    onSuccess: ({ data }) => {
      const ajustados = data?.itensAjustados ?? 0
      toast.success(
        ajustados === 0
          ? 'Contagem finalizada — nenhuma quantidade precisou mudar'
          : `Contagem finalizada — ${ajustados} ${ajustados === 1 ? 'item ajustado' : 'itens ajustados'}`
      )
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? 'Não foi possível finalizar a contagem')
    },
  })

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" className="w-full sm:w-auto" disabled={isExecuting}>
          <CheckCheck className="size-4" />
          Finalizar contagem
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Finalizar a contagem?</AlertDialogTitle>
          <AlertDialogDescription>
            {linhasDivergentes === 0
              ? 'Nenhuma divergência — nenhuma quantidade vai mudar.'
              : `${linhasDivergentes} ${linhasDivergentes === 1 ? 'item vai ter a quantidade corrigida' : 'itens vão ter a quantidade corrigida'} para o que você contou, com o ajuste registrado no histórico.`}
            {linhasPendentes > 0 && (
              <>
                {' '}
                {linhasPendentes}{' '}
                {linhasPendentes === 1
                  ? 'item ficou sem contagem e não será tocado'
                  : 'itens ficaram sem contagem e não serão tocados'}
                .
              </>
            )}{' '}
            Depois de finalizar, essa contagem não pode mais ser editada.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={() => execute({ id: inventarioId })}>
            Finalizar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
