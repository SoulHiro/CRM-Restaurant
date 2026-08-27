'use client'

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
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card'
import { EmptyState } from '@repo/ui/components/empty-state'

import { formatCurrencyBRL } from '@/lib/formatters'
import { quitarConsumoAction } from '../lib/actions'
import type { FuncionarioConsumo } from '../lib/types'

export function ResumoPendente({
  funcionario,
  onQuitado,
}: {
  funcionario: FuncionarioConsumo | null
  onQuitado: (funcionarioId: string) => void
}) {
  const { execute, isExecuting } = useAction(quitarConsumoAction, {
    onSuccess: () => {
      if (!funcionario) return
      toast.success(`Consumo de ${funcionario.nome} quitado`)
      onQuitado(funcionario.id)
    },
    onError: () => toast.error('Não foi possível quitar'),
  })

  return (
    <Card className="border-0">
      <CardHeader>
        <CardTitle className="text-base">
          {funcionario ? funcionario.nome : 'Consumo pendente'}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {!funcionario ? (
          <EmptyState message="Selecione uma funcionária pra ver o consumo dela." />
        ) : funcionario.itensPendentes.length === 0 ? (
          <EmptyState message="Nada pendente — em dia." />
        ) : (
          <>
            <div className="flex flex-col gap-1">
              {funcionario.itensPendentes.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 rounded-md bg-muted/50 p-2 text-sm"
                >
                  <span className="truncate">
                    {item.quantidade > 1 && `${item.quantidade}× `}
                    {item.produtoNome}
                  </span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {formatCurrencyBRL(item.quantidade * item.precoUnitario)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between rounded-md bg-muted/50 p-3 text-sm">
              <span className="text-muted-foreground">Total pendente</span>
              <span className="text-lg font-bold tabular-nums">
                {formatCurrencyBRL(funcionario.totalPendente)}
              </span>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="w-full" disabled={isExecuting}>
                  Quitar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Quitar consumo de {funcionario.nome}?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Marca {formatCurrencyBRL(funcionario.totalPendente)} em{' '}
                    {funcionario.itensPendentes.length}{' '}
                    {funcionario.itensPendentes.length === 1
                      ? 'item'
                      : 'itens'}{' '}
                    como pago. Isso não é desconto automático em folha — é só
                    o registro de que foi resolvido.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Voltar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => execute({ funcionarioId: funcionario.id })}
                  >
                    Quitar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </CardContent>
    </Card>
  )
}
