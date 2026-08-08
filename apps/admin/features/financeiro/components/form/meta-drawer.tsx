'use client'

import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Target } from 'lucide-react'
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
import { upsertMetaAction } from '../../lib/actions'
import { upsertMetaSchema, type UpsertMetaInput } from '../../lib/schemas'
import type { Meta } from '../../lib/types'

function tresMesesDepois(hoje: string): string {
  const d = new Date(`${hoje}T00:00:00Z`)
  d.setUTCMonth(d.getUTCMonth() + 3)
  return d.toISOString().slice(0, 10)
}

export function CriarMetaDrawer({
  hoje,
  meta,
}: {
  hoje: string
  meta?: Meta
}) {
  const [open, setOpen] = useState(false)
  const { direction, variant } = useDrawerDirection()
  const editando = meta != null

  const defaultValues: UpsertMetaInput = meta
    ? {
        id: meta.id,
        descricao: meta.descricao,
        tipo: meta.tipo,
        valorAlvo: meta.valorAlvo ?? undefined,
        inicio: meta.inicio,
        prazo: meta.prazo,
      }
    : {
        id: undefined,
        descricao: '',
        tipo: 'financeira',
        valorAlvo: undefined,
        inicio: hoje,
        prazo: tresMesesDepois(hoje),
      }

  const form = useForm<UpsertMetaInput>({
    resolver: zodResolver(upsertMetaSchema),
    defaultValues,
  })

  useEffect(() => {
    if (!open) form.reset(defaultValues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const { execute, isExecuting } = useAction(upsertMetaAction, {
    onSuccess: () => {
      toast.success(editando ? 'Meta atualizada' : 'Meta definida')
      setOpen(false)
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? 'Não foi possível salvar a meta')
    },
  })

  return (
    <Drawer direction={direction} open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          size="sm"
          variant={editando ? 'outline' : 'default'}
          className="w-full sm:w-auto"
        >
          <Target className="size-4" />
          {editando ? 'Editar meta' : 'Definir meta'}
        </Button>
      </DrawerTrigger>
      <DrawerContent
        direction={direction}
        variant={variant}
        className="flex max-h-[85vh] w-full flex-col gap-0 overflow-y-auto sm:max-h-none sm:max-w-lg"
      >
        <DrawerHeader>
          <DrawerTitle>{editando ? 'Editar meta' : 'Nova meta'}</DrawerTitle>
          <DrawerDescription>
            O progresso é calculado sozinho, somando o lucro dos lançamentos
            dentro do período.
          </DrawerDescription>
        </DrawerHeader>

        <Form {...form}>
          <form
            id="meta-form"
            onSubmit={form.handleSubmit((values) => execute(values))}
            className="flex flex-1 flex-col gap-6 px-4 py-6"
          >
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Qual é a meta</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: entrada do restaurante"
                      autoFocus
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
              name="valorAlvo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quanto precisa juntar (R$)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      inputMode="decimal"
                      placeholder="Ex: 360000"
                      className="h-11 text-lg sm:h-10"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="inicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contando desde</FormLabel>
                    <FormControl>
                      <Input type="date" className="h-11 sm:h-9" {...field} />
                    </FormControl>
                    <FormDescription>
                      O lucro passa a contar a partir daqui.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="prazo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Até quando</FormLabel>
                    <FormControl>
                      <Input type="date" className="h-11 sm:h-9" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>

        <DrawerFooter>
          <Button
            type="submit"
            form="meta-form"
            className="w-full"
            disabled={isExecuting}
          >
            {isExecuting ? 'Salvando...' : 'Salvar meta'}
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
