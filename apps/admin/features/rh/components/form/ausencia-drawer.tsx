'use client'

import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarOff, Pencil } from 'lucide-react'
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
import { registrarAusenciaAction } from '../../lib/actions'
import {
  AUSENCIA_LABELS,
  diasDeAusencia,
} from '../../lib/ausencia-helpers'
import {
  registrarAusenciaDefaultValues,
  registrarAusenciaSchema,
  type RegistrarAusenciaInput,
} from '../../lib/schemas'
import { AUSENCIA_TIPOS, type Ausencia } from '../../lib/types'

export function AusenciaDrawer({
  funcionarioId,
  funcionarioNome,
  ausencia,
  hoje,
}: {
  funcionarioId: string
  funcionarioNome: string
  ausencia?: Ausencia
  hoje: string
}) {
  const [open, setOpen] = useState(false)
  const { direction, variant } = useDrawerDirection()
  const editando = ausencia != null

  const defaultValues: RegistrarAusenciaInput = ausencia
    ? {
        id: ausencia.id,
        funcionarioId,
        tipo: ausencia.tipo,
        dataInicio: ausencia.dataInicio,
        dataFim: ausencia.dataFim,
        observacao: ausencia.observacao ?? '',
      }
    : registrarAusenciaDefaultValues(funcionarioId, hoje)

  const form = useForm<RegistrarAusenciaInput>({
    resolver: zodResolver(registrarAusenciaSchema),
    defaultValues,
  })

  useEffect(() => {
    if (!open) form.reset(defaultValues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const salvar = useAction(registrarAusenciaAction, {
    onSuccess: () => {
      toast.success(editando ? 'Ausência atualizada' : 'Ausência registrada')
      setOpen(false)
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? 'Não foi possível salvar')
    },
  })

  const inicio = form.watch('dataInicio')
  const fim = form.watch('dataFim')
  const dias = inicio && fim ? diasDeAusencia(inicio, fim) : 0

  return (
    <Drawer direction={direction} open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        {editando ? (
          <Button variant="ghost" size="icon" aria-label="Editar ausência">
            <Pencil className="size-4" />
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            <CalendarOff className="size-4" />
            Ausência
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
            {editando ? 'Editar ausência' : `Ausência de ${funcionarioNome}`}
          </DrawerTitle>
          <DrawerDescription>
            Em quem recebe por diária, os dias registrados aqui saem da conta da
            folha do mês.
          </DrawerDescription>
        </DrawerHeader>

        <Form {...form}>
          <form
            id="ausencia-form"
            onSubmit={form.handleSubmit((values) => salvar.execute(values))}
            className="flex flex-1 flex-col gap-6 px-4 py-6"
          >
            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger autoFocus className="h-11 sm:h-9">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {AUSENCIA_TIPOS.map((tipo) => (
                        <SelectItem key={tipo} value={tipo}>
                          {AUSENCIA_LABELS[tipo]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="dataInicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>De</FormLabel>
                    <FormControl>
                      <Input type="date" className="h-11 sm:h-9" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dataFim"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Até</FormLabel>
                    <FormControl>
                      <Input type="date" className="h-11 sm:h-9" {...field} />
                    </FormControl>
                    <FormDescription>
                      {dias > 0 && `${dias} ${dias === 1 ? 'dia' : 'dias'}`}
                    </FormDescription>
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
                      placeholder="Ex: atestado entregue no dia seguinte"
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
            form="ausencia-form"
            className="w-full"
            disabled={salvar.isExecuting}
          >
            {salvar.isExecuting ? 'Salvando...' : 'Salvar ausência'}
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
