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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select'
import { cn } from '@repo/ui/lib/utils'

import { createTransacaoAction, updateTransacaoAction } from '../../lib/actions'
import { ORIGEM_LABELS, SUBTIPO_LABELS } from '../../lib/dre-helpers'
import {
  createTransacaoDefaultValues,
  createTransacaoSchema,
  type CreateTransacaoInput,
} from '../../lib/schemas'
import {
  DESPESA_SUBTIPOS,
  TRANSACAO_ORIGENS,
  type Transacao,
} from '../../lib/types'

export function TransacaoForm({
  transacao,
  hoje,
  open,
  onOpenChange,
}: {
  transacao?: Transacao
  hoje: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const editando = transacao != null

  const defaultValues: CreateTransacaoInput = transacao
    ? {
        tipo: transacao.tipo,
        origem: transacao.origem,
        valor: transacao.valor,
        data: transacao.data,
        descricao: transacao.descricao,
        categoria: transacao.categoria ?? undefined,
        subtipo: transacao.subtipo ?? undefined,
      }
    : createTransacaoDefaultValues(hoje)

  const form = useForm<CreateTransacaoInput>({
    resolver: zodResolver(createTransacaoSchema),
    defaultValues,
  })

  useEffect(() => {
    if (!open) form.reset(defaultValues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const tipo = form.watch('tipo')
  const eDespesa = tipo === 'despesa'

  const criar = useAction(createTransacaoAction, {
    onSuccess: () => {
      toast.success('Lançamento registrado')
      onOpenChange(false)
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? 'Não foi possível lançar')
    },
  })

  const editar = useAction(updateTransacaoAction, {
    onSuccess: () => {
      toast.success('Lançamento atualizado')
      onOpenChange(false)
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? 'Não foi possível salvar')
    },
  })

  const salvando = criar.isExecuting || editar.isExecuting

  function onSubmit(values: CreateTransacaoInput) {
    if (transacao) {
      editar.execute({ ...values, id: transacao.id })
      return
    }
    criar.execute(values)
  }

  return (
    <>
      <Form {...form}>
        <form
          id="transacao-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-1 flex-col gap-6 px-4 py-6"
        >
          <FormField
            control={form.control}
            name="tipo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>O dinheiro entrou ou saiu?</FormLabel>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={field.value === 'receita' ? 'default' : 'outline'}
                    className={cn(
                      'h-11 sm:h-10',
                      field.value === 'receita' &&
                        'bg-emerald-600 text-white hover:bg-emerald-600/90'
                    )}
                    onClick={() => field.onChange('receita')}
                  >
                    Entrou
                  </Button>
                  <Button
                    type="button"
                    variant={field.value === 'despesa' ? 'default' : 'outline'}
                    className={cn(
                      'h-11 sm:h-10',
                      field.value === 'despesa' &&
                        'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                    )}
                    onClick={() => field.onChange('despesa')}
                  >
                    Saiu
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="valor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor (R$)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    inputMode="decimal"
                    autoFocus
                    className="h-11 text-lg sm:h-10"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="descricao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl>
                  <Input
                    placeholder={
                      eDespesa ? 'Ex: conta de luz' : 'Ex: venda do salão'
                    }
                    className="h-11 sm:h-9"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="data"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quando</FormLabel>
                  <FormControl>
                    <Input type="date" className="h-11 sm:h-9" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="origem"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Por onde</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="h-11 sm:h-9">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TRANSACAO_ORIGENS.map((origem) => (
                        <SelectItem key={origem} value={origem}>
                          {ORIGEM_LABELS[origem]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {eDespesa && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="categoria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custo fixo ou variável?</FormLabel>
                    <Select
                      value={field.value ?? ''}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11 sm:h-9">
                          <SelectValue placeholder="Escolha" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="fixa">
                          Fixa — acontece todo mês
                        </SelectItem>
                        <SelectItem value="variavel">
                          Variável — varia com a venda
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      É o que permite saber quanto precisa vender só para
                      empatar.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subtipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo da despesa</FormLabel>
                    <Select
                      value={field.value ?? ''}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11 sm:h-9">
                          <SelectValue placeholder="Escolha" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DESPESA_SUBTIPOS.map((subtipo) => (
                          <SelectItem key={subtipo} value={subtipo}>
                            {SUBTIPO_LABELS[subtipo]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </form>
      </Form>

      <DrawerFooter>
        <Button
          type="submit"
          form="transacao-form"
          className="w-full"
          disabled={salvando}
        >
          {salvando
            ? 'Salvando...'
            : editando
              ? 'Salvar lançamento'
              : 'Lançar'}
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
