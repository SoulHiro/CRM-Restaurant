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

import { useDrawerDirection } from '@/hooks/use-drawer-direction'
import {
  createContaReceberAction,
  updateContaReceberAction,
} from '../../lib/actions'
import {
  createContaReceberDefaultValues,
  createContaReceberSchema,
  type CreateContaReceberInput,
} from '../../lib/schemas'
import type { ContaReceber } from '../../lib/types'

export function ContaReceberDrawer({
  hoje,
  periodo,
  conta,
}: {
  hoje: string
  periodo: string
  conta?: ContaReceber
}) {
  const [open, setOpen] = useState(false)
  const { direction, variant } = useDrawerDirection()
  const editando = conta != null

  const defaultValues: CreateContaReceberInput = conta
    ? {
        empresaNome: conta.empresaNome,
        periodo: conta.periodo,
        valor: conta.valor,
        dataVencimento: conta.dataVencimento,
        observacao: conta.observacao ?? '',
      }
    : createContaReceberDefaultValues(hoje, periodo)

  const form = useForm<CreateContaReceberInput>({
    resolver: zodResolver(createContaReceberSchema),
    defaultValues,
  })

  useEffect(() => {
    if (!open) form.reset(defaultValues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const criar = useAction(createContaReceberAction, {
    onSuccess: () => {
      toast.success('Cobrança criada')
      setOpen(false)
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? 'Não foi possível criar a cobrança')
    },
  })

  const editar = useAction(updateContaReceberAction, {
    onSuccess: () => {
      toast.success('Cobrança atualizada')
      setOpen(false)
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? 'Não foi possível salvar')
    },
  })

  const salvando = criar.isExecuting || editar.isExecuting

  function onSubmit(values: CreateContaReceberInput) {
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
          <Button variant="ghost" size="icon" aria-label="Editar cobrança">
            <Pencil className="size-4" />
          </Button>
        ) : (
          <Button size="sm" className="w-full sm:w-auto">
            <Plus className="size-4" />
            Nova cobrança
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
            {editando ? 'Editar cobrança' : 'Nova cobrança'}
          </DrawerTitle>
          <DrawerDescription>
            O que uma empresa cliente ainda deve. Vira receita quando você
            marcar como recebida.
          </DrawerDescription>
        </DrawerHeader>

        <Form {...form}>
          <form
            id="conta-receber-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-1 flex-col gap-6 px-4 py-6"
          >
            <FormField
              control={form.control}
              name="empresaNome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empresa</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Metalúrgica Silva"
                      autoFocus
                      className="h-11 sm:h-9"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Por enquanto é digitado. Quando o cadastro de empresas
                    entrar no ar, a gente liga os dois.
                  </FormDescription>
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

            <FormField
              control={form.control}
              name="periodo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referente a</FormLabel>
                  <FormControl>
                    <Input
                      type="month"
                      className="h-11 sm:h-9"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    O mês de consumo que essa cobrança fecha.
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
                  <FormLabel>Observação (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: paga por boleto, 10 dias após o fechamento"
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
            form="conta-receber-form"
            className="w-full"
            disabled={salvando}
          >
            {salvando
              ? 'Salvando...'
              : editando
                ? 'Salvar cobrança'
                : 'Criar cobrança'}
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
