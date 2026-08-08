'use client'

import { Check, Undo2 } from 'lucide-react'
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

import { formatCurrencyBRL } from '@/lib/formatters'
import {
  desfazerPagamentoAction,
  desfazerRecebimentoAction,
  marcarContaPagaAction,
  marcarContaRecebidaAction,
} from '../../lib/actions'
import type { ContaStatus } from '../../lib/types'

/**
 * Um clique só para o caso comum (quitar), e confirmação só no desfazer —
 * que é o caminho raro e o que mexe no resultado já fechado.
 */
export function QuitarContaButton({
  id,
  tipo,
  status,
  valor,
  descricao,
  hoje,
}: {
  id: string
  tipo: 'pagar' | 'receber'
  status: ContaStatus
  valor: number
  descricao: string
  hoje: string
}) {
  const quitar = useAction(
    tipo === 'pagar' ? marcarContaPagaAction : marcarContaRecebidaAction,
    {
      onSuccess: () =>
        toast.success(tipo === 'pagar' ? 'Conta paga' : 'Cobrança recebida'),
      onError: ({ error }) =>
        toast.error(error.serverError ?? 'Não foi possível concluir'),
    }
  )

  const desfazer = useAction(
    tipo === 'pagar' ? desfazerPagamentoAction : desfazerRecebimentoAction,
    {
      onSuccess: () => toast.success('Voltou para em aberto'),
      onError: ({ error }) =>
        toast.error(error.serverError ?? 'Não foi possível desfazer'),
    }
  )

  if (status === 'pendente') {
    return (
      <Button
        size="sm"
        className="w-full sm:w-auto"
        disabled={quitar.isExecuting}
        onClick={() => quitar.execute({ id, dataPagamento: hoje })}
      >
        <Check className="size-4" />
        {tipo === 'pagar' ? 'Paguei' : 'Recebi'}
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
          disabled={desfazer.isExecuting}
        >
          <Undo2 className="size-4" />
          Desfazer
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Desfazer {tipo === 'pagar' ? 'o pagamento' : 'o recebimento'}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            &ldquo;{descricao}&rdquo; volta para em aberto e{' '}
            {formatCurrencyBRL(valor)} sai do resultado do mês — o lançamento
            que essa conta gerou é apagado junto.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={() => desfazer.execute({ id })}>
            Desfazer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
