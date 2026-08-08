'use client'

import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { ClipboardList } from 'lucide-react'
import { useRouter } from 'next/navigation'
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
import { iniciarInventarioAction } from '../../lib/actions'
import {
  iniciarInventarioSchema,
  type IniciarInventarioInput,
} from '../../lib/schemas'

export function IniciarInventarioDrawer({
  hoje,
  itensAtivos,
  disabled,
}: {
  hoje: string
  itensAtivos: number
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { direction, variant } = useDrawerDirection()

  const defaultValues: IniciarInventarioInput = { data: hoje, observacao: '' }

  const form = useForm<IniciarInventarioInput>({
    resolver: zodResolver(iniciarInventarioSchema),
    defaultValues,
  })

  useEffect(() => {
    if (!open) form.reset(defaultValues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const { execute, isExecuting } = useAction(iniciarInventarioAction, {
    onSuccess: ({ data }) => {
      toast.success('Contagem aberta')
      setOpen(false)
      if (data?.inventarioId) {
        router.push(`/estoque/inventario/${data.inventarioId}`)
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? 'Não foi possível abrir a contagem')
    },
  })

  return (
    <Drawer direction={direction} open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button size="sm" className="w-full sm:w-auto" disabled={disabled}>
          <ClipboardList className="size-4" />
          Nova contagem
        </Button>
      </DrawerTrigger>
      <DrawerContent
        direction={direction}
        variant={variant}
        className="flex max-h-[85vh] w-full flex-col gap-0 overflow-y-auto sm:max-h-none sm:max-w-lg"
      >
        <DrawerHeader>
          <DrawerTitle>Nova contagem</DrawerTitle>
          <DrawerDescription>
            Vamos congelar a quantidade dos {itensAtivos}{' '}
            {itensAtivos === 1 ? 'item ativo' : 'itens ativos'} agora, para a
            conferência não correr atrás de número que continua se mexendo.
          </DrawerDescription>
        </DrawerHeader>

        <Form {...form}>
          <form
            id="iniciar-inventario-form"
            onSubmit={form.handleSubmit((values) => execute(values))}
            className="flex flex-1 flex-col gap-6 px-4 py-6"
          >
            <FormField
              control={form.control}
              name="data"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data da contagem</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
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
                  <FormLabel>Observação (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: contagem do fechamento de mês"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormDescription>
                    Você entra como responsável pela contagem.
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
            form="iniciar-inventario-form"
            className="w-full"
            disabled={isExecuting}
          >
            {isExecuting ? 'Abrindo...' : 'Abrir contagem'}
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
