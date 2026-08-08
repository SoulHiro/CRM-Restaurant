'use client'

import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil, Plus } from 'lucide-react'
import { useAction } from 'next-safe-action/hooks'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@repo/ui/components/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@repo/ui/components/drawer'
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

import { useDrawerDirection } from '@/hooks/use-drawer-direction'
import {
  createContaPagarAction,
  updateContaPagarAction,
} from '../../lib/actions'
import { SUBTIPO_LABELS } from '../../lib/dre-helpers'
import {
  createContaPagarDefaultValues,
  createContaPagarSchema,
  type CreateContaPagarInput,
} from '../../lib/schemas'
import { DESPESA_SUBTIPOS, type ContaPagar } from '../../lib/types'

export function ContaPagarDrawer({
  hoje,
  conta,
}: {
  hoje: string
  conta?: ContaPagar
}) {
  const [open, setOpen] = useState(false)
  const { direction, variant } = useDrawerDirection()
  const editando = conta != null

  const defaultValues: CreateContaPagarInput = conta
    ? {
        descricao: conta.descricao,
        categoria: conta.categoria,
        subtipo: conta.subtipo,
        valor: conta.valor,
        dataVencimento: conta.dataVencimento,
        observacao: conta.observacao ?? '',
      }
    : createContaPagarDefaultValues(hoje)

  const form = useForm<CreateContaPagarInput>({
    resolver: zodResolver(createContaPagarSchema),
    defaultValues,
  })

  useEffect(() => {
    if (!open) form.reset(defaultValues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const criar = useAction(createContaPagarAction, {
    onSuccess: () => {
      toast.success('Conta criada')
      setOpen(false)
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? 'Não foi possível criar a conta')
    },
  })

  const editar = useAction(updateContaPagarAction, {
    onSuccess: () => {
      toast.success('Conta atualizada')
      setOpen(false)
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? 'Não foi possível salvar')
    },
  })

  const salvando = criar.isExecuting || editar.isExecuting

  function onSubmit(values: CreateContaPagarInput) {
    if (conta) {
      editar.execute({ ...values, id: conta.id })
      return
    }
    criar.execute(values)
  }

  return (
    <Drawer direction={direction} open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        {editando ? (
          <Button variant="ghost" size="icon" aria-label="Editar conta">
            <Pencil className="size-4" />
          </Button>
        ) : (
          <Button size="sm" className="w-full sm:w-auto">
            <Plus className="size-4" />
            Nova conta
          </Button>
        )}
      </DrawerTrigger>
      <DrawerContent
        direction={direction}
        variant={variant}
        className="flex max-h-[85vh] w-full flex-col gap-0 overflow-y-auto sm:max-h-none sm:max-w-lg"
      >
        <DrawerHeader>
          <DrawerTitle>
            {editando ? 'Editar conta' : 'Nova conta a pagar'}
          </DrawerTitle>
          <DrawerDescription>
            Só previsão de saída — vira despesa de verdade quando você marcar
            como paga.
          </DrawerDescription>
        </DrawerHeader>

        <Form {...form}>
          <form
            id="conta-pagar-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-1 flex-col gap-6 px-4 py-6"
          >
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>O que é</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: aluguel de setembro"
                      autoFocus
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
                        className="h-11 sm:h-9"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dataVencimento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vence em</FormLabel>
                    <FormControl>
                      <Input type="date" className="h-11 sm:h-9" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="categoria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custo fixo ou variável?</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-11 sm:h-9">
                          <SelectValue />
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
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-11 sm:h-9">
                          <SelectValue />
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

            <FormField
              control={form.control}
              name="observacao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observação (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: pagar por boleto até as 14h"
                      className="h-11 sm:h-9"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormDescription>
                    Some da lista assim que a conta for quitada.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <DrawerFooter>
          <Button
            type="submit"
            form="conta-pagar-form"
            className="w-full"
            disabled={salvando}
          >
            {salvando ? 'Salvando...' : editando ? 'Salvar conta' : 'Criar conta'}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setOpen(false)}
          >
            Cancelar
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
