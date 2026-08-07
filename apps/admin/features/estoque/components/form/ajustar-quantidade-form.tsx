'use client'

import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAction } from 'next-safe-action/hooks'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@repo/ui/components/button'
import { DrawerFooter } from '@repo/ui/components/drawer'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui/components/form'
import { Input } from '@repo/ui/components/input'

import { ajustarQuantidadeAction } from '../../lib/actions'
import {
  ajustarQuantidadeDefaultValues,
  ajustarQuantidadeSchema,
  type AjustarQuantidadeInput,
} from '../../lib/schemas'
import type { EstoqueItem } from '../../lib/types'
import { formatQuantidade } from '../shared/quantidade'

export function AjustarQuantidadeForm({
  item,
  open,
  onOpenChange,
}: {
  item: EstoqueItem
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const defaultValues = ajustarQuantidadeDefaultValues(
    item.id,
    item.quantidadeAtual
  )

  const form = useForm<AjustarQuantidadeInput>({
    resolver: zodResolver(ajustarQuantidadeSchema),
    defaultValues,
  })

  useEffect(() => {
    if (!open) form.reset(defaultValues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const { execute, isExecuting } = useAction(ajustarQuantidadeAction, {
    onSuccess: ({ data }) => {
      toast.success(
        data?.ajustado
          ? 'Quantidade corrigida'
          : 'Já estava certo — nada mudou'
      )
      onOpenChange(false)
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? 'Não foi possível corrigir a quantidade')
    },
  })

  const quantidadeCorreta = Number(form.watch('quantidadeCorreta')) || 0
  const diferenca =
    Math.round((quantidadeCorreta - item.quantidadeAtual) * 1000) / 1000

  return (
    <>
      <Form {...form}>
        <form
          id="ajustar-quantidade-form"
          onSubmit={form.handleSubmit((values) => execute(values))}
          className="flex flex-1 flex-col gap-6 px-4 py-6"
        >
          <FormField
            control={form.control}
            name="quantidadeCorreta"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantidade correta ({item.unidade})</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.001"
                    min="0"
                    inputMode="decimal"
                    autoFocus
                    className="h-11 text-lg sm:h-9 sm:text-base"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Está em {formatQuantidade(item.quantidadeAtual)}{' '}
                  {item.unidade} agora.
                  {diferenca !== 0 && (
                    <>
                      {' '}
                      Vai{' '}
                      <span
                        className={
                          diferenca > 0
                            ? 'font-medium text-emerald-600 dark:text-emerald-400'
                            : 'font-medium text-destructive'
                        }
                      >
                        {diferenca > 0 ? 'somar' : 'tirar'}{' '}
                        {formatQuantidade(Math.abs(diferenca))} {item.unidade}
                      </span>{' '}
                      no histórico.
                    </>
                  )}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="observacao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Motivo (opcional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: contagem física, cadastro errado..."
                    className="h-11 sm:h-9"
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>

      <DrawerFooter>
        <Button
          type="submit"
          form="ajustar-quantidade-form"
          className="w-full"
          disabled={isExecuting}
        >
          {isExecuting ? 'Salvando...' : 'Corrigir quantidade'}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => onOpenChange(false)}
        >
          Cancelar
        </Button>
      </DrawerFooter>
    </>
  )
}
