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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui/components/form'
import { Input } from '@repo/ui/components/input'

import { createPausaAction } from '../../lib/actions'
import {
  createPausaDefaultValues,
  createPausaSchema,
  type CreatePausaInput,
} from '../../lib/schemas'

export function CadastrarPausaForm({
  empresaId,
  open,
  onOpenChange,
}: {
  empresaId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const defaultValues = createPausaDefaultValues(empresaId)

  const form = useForm<CreatePausaInput>({
    resolver: zodResolver(createPausaSchema),
    defaultValues,
  })

  useEffect(() => {
    if (!open) form.reset(defaultValues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const { execute } = useAction(createPausaAction, {
    onSuccess: () => {
      toast.success('Pausa registrada com sucesso')
      onOpenChange(false)
    },
    onError: () => {
      toast.error('Não foi possível registrar a pausa')
    },
  })

  function onSubmit(values: CreatePausaInput) {
    execute(values)
  }

  return (
    <>
      <Form {...form}>
        <form
          id="cadastrar-pausa-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-1 flex-col gap-6 px-4 py-6"
        >
          <FormField
            control={form.control}
            name="data"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="motivo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Motivo (opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: feriado, manutenção..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>

      <DrawerFooter>
        <Button type="submit" form="cadastrar-pausa-form" className="w-full">
          Salvar pausa
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
