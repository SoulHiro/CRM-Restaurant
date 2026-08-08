'use client'

import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { formatCurrencyBRL } from '@/lib/formatters'
import { registrarAjusteMetaAction } from '../../lib/actions'
import {
  registrarAjusteMetaSchema,
  type RegistrarAjusteMetaInput,
} from '../../lib/schemas'

export function AjustarMetaDrawer({
  metaId,
  hoje,
}: {
  metaId: string
  hoje: string
}) {
  const [open, setOpen] = useState(false)
  const { direction, variant } = useDrawerDirection()

  const defaultValues: RegistrarAjusteMetaInput = {
    metaId,
    valor: 0,
    data: hoje,
    observacao: '',
  }

  const form = useForm<RegistrarAjusteMetaInput>({
    resolver: zodResolver(registrarAjusteMetaSchema),
    defaultValues,
  })

  useEffect(() => {
    if (!open) form.reset(defaultValues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const { execute, isExecuting } = useAction(registrarAjusteMetaAction, {
    onSuccess: () => {
      toast.success('Ajuste registrado')
      setOpen(false)
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? 'Não foi possível registrar o ajuste')
    },
  })

  const valor = Number(form.watch('valor')) || 0

  return (
    <Drawer direction={direction} open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm" className="mt-1 w-full">
          Registrar aporte ou retirada
        </Button>
      </DrawerTrigger>
      <DrawerContent
        direction={direction}
        variant={variant}
        className="flex max-h-[85vh] w-full flex-col gap-0 overflow-y-auto sm:max-h-none sm:max-w-lg"
      >
        <DrawerHeader>
          <DrawerTitle>Aporte ou retirada</DrawerTitle>
          <DrawerDescription>
            Dinheiro que entrou ou saiu da meta por fora da operação — e que
            por isso não aparece nos lançamentos.
          </DrawerDescription>
        </DrawerHeader>

        <Form {...form}>
          <form
            id="ajuste-meta-form"
            onSubmit={form.handleSubmit((values) => execute(values))}
            className="flex flex-1 flex-col gap-6 px-4 py-6"
          >
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
                      inputMode="decimal"
                      autoFocus
                      className="h-11 text-lg sm:h-10"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {valor > 0 ? (
                      <>
                        Vai{' '}
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">
                          somar {formatCurrencyBRL(valor)}
                        </span>{' '}
                        na meta.
                      </>
                    ) : valor < 0 ? (
                      <>
                        Vai{' '}
                        <span className="font-medium text-destructive">
                          tirar {formatCurrencyBRL(Math.abs(valor))}
                        </span>{' '}
                        da meta.
                      </>
                    ) : (
                      'Use número negativo para registrar uma retirada.'
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
              name="observacao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: aporte pessoal"
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
            form="ajuste-meta-form"
            className="w-full"
            disabled={isExecuting}
          >
            {isExecuting ? 'Salvando...' : 'Registrar'}
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
