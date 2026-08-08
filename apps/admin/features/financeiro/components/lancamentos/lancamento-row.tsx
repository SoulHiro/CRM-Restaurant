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
import { MobileCellLabel } from '@repo/ui/components/mobile-cell-label'
import { cn } from '@repo/ui/lib/utils'

import { formatDateBR } from '@/lib/formatters'
import { deleteTransacaoAction } from '../../lib/actions'
import { ORIGEM_LABELS } from '../../lib/dre-helpers'
import type { Transacao } from '../../lib/types'
import { TipoTransacaoBadge } from '../shared/tipo-transacao-badge'
import { ValorMonetario } from '../shared/valor-monetario'
import { LancarTransacaoDrawer } from '../form/lancar-transacao-drawer'

export function LancamentoRow({
  transacao,
  hoje,
  className,
}: {
  transacao: Transacao
  hoje: string
  className: string
}) {
  const { execute, isExecuting } = useAction(deleteTransacaoAction, {
    onSuccess: () => toast.success('Lançamento removido'),
    onError: ({ error }) =>
      toast.error(error.serverError ?? 'Não foi possível remover'),
  })

  // Lançamento nascido de uma conta paga não se edita nem se apaga por aqui —
  // ele é o reflexo daquela conta.
  const geradoPorConta = transacao.origemId != null

  return (
    <div role="row" className={cn('rounded-lg bg-card', className)}>
      <span role="cell" className="flex min-w-0 flex-col">
        <span className="truncate font-medium">{transacao.descricao}</span>
        <span className="text-xs text-muted-foreground">
          {ORIGEM_LABELS[transacao.origem]}
          {geradoPorConta && ' · de uma conta'}
        </span>
      </span>

      <span
        role="cell"
        className="flex items-center justify-between gap-2 sm:block"
      >
        <MobileCellLabel>Tipo</MobileCellLabel>
        <TipoTransacaoBadge
          tipo={transacao.tipo}
          categoria={transacao.categoria}
        />
      </span>

      <span
        role="cell"
        className="flex items-center justify-between gap-2 text-sm sm:block"
      >
        <MobileCellLabel>Data</MobileCellLabel>
        <span className="tabular-nums">{formatDateBR(transacao.data)}</span>
      </span>

      <span
        role="cell"
        className="flex items-center justify-between gap-2 sm:block sm:text-right"
      >
        <MobileCellLabel>Valor</MobileCellLabel>
        <ValorMonetario
          valor={transacao.valor}
          tipo={transacao.tipo}
          sinal
          className="font-medium"
        />
      </span>

      <span role="cell" className="flex justify-end gap-1">
        {geradoPorConta ? (
          <span className="self-center text-xs text-muted-foreground">
            Pela conta
          </span>
        ) : (
          <>
            <LancarTransacaoDrawer hoje={hoje} transacao={transacao} />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Remover lançamento"
                  disabled={isExecuting}
                >
                  <Trash2 className="size-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remover lançamento?</AlertDialogTitle>
                  <AlertDialogDescription>
                    &ldquo;{transacao.descricao}&rdquo; sai do resultado do mês.
                    Essa ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => execute({ id: transacao.id })}
                  >
                    Remover
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </span>
    </div>
  )
}
