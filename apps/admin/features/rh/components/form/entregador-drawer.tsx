'use client'

import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Bike } from 'lucide-react'
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
import { upsertEntregadorAction } from '../../lib/actions'
import { DIAS_DA_SEMANA } from '../../lib/ausencia-helpers'
import {
  upsertEntregadorSchema,
  type UpsertEntregadorInput,
} from '../../lib/schemas'
import type { Entregador } from '../../lib/types'

const SEM_FOLGA_FIXA = 'nenhum'

export function EntregadorDrawer({
  funcionarioId,
  funcionarioNome,
  entregador,
}: {
  funcionarioId: string
  funcionarioNome: string
  entregador: Entregador | null
}) {
  const [open, setOpen] = useState(false)
  const { direction, variant } = useDrawerDirection()

  const defaultValues: UpsertEntregadorInput = {
    funcionarioId,
    valorDiaria: entregador?.valorDiaria ?? 0,
    taxaEntregaPercentual: entregador?.taxaEntregaPercentual ?? undefined,
    folgaSemanal: entregador?.folgaSemanal ?? undefined,
  }

  const form = useForm<UpsertEntregadorInput>({
    resolver: zodResolver(upsertEntregadorSchema),
    defaultValues,
  })

  useEffect(() => {
    if (!open) form.reset(defaultValues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const salvar = useAction(upsertEntregadorAction, {
    onSuccess: () => {
      toast.success('Diária salva')
      setOpen(false)
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? 'Não foi possível salvar')
    },
  })

  return (
    <Drawer direction={direction} open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm" className="w-full sm:w-auto">
          <Bike className="size-4" />
          {entregador ? 'Diária' : 'Tornar entregador'}
        </Button>
      </DrawerTrigger>
      <DrawerContent
        direction={direction}
        variant={variant}
        className="flex max-h-[85vh] w-full flex-col gap-0 overflow-y-auto sm:max-h-none sm:max-w-lg"
      >
        <DrawerHeader>
          <DrawerTitle>Diária de {funcionarioNome}</DrawerTitle>
          <DrawerDescription>
            Quem recebe por diária não entra na folha com salário fixo: entra
            com as diárias do mês, descontadas as ausências registradas.
          </DrawerDescription>
        </DrawerHeader>

        <Form {...form}>
          <form
            id="entregador-form"
            onSubmit={form.handleSubmit((values) => salvar.execute(values))}
            className="flex flex-1 flex-col gap-6 px-4 py-6"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="valorDiaria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor da diária (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        inputMode="decimal"
                        autoFocus
                        className="h-11 tabular-nums sm:h-9"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="taxaEntregaPercentual"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Taxa de entrega (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        inputMode="decimal"
                        className="h-11 tabular-nums sm:h-9"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Opcional — repasse quando aplicável.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="folgaSemanal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Folga fixa na semana</FormLabel>
                  <Select
                    value={field.value == null ? SEM_FOLGA_FIXA : String(field.value)}
                    onValueChange={(valor) =>
                      field.onChange(
                        valor === SEM_FOLGA_FIXA ? undefined : Number(valor)
                      )
                    }
                  >
                    <FormControl>
                      <SelectTrigger className="h-11 sm:h-9">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={SEM_FOLGA_FIXA}>
                        Sem dia fixo
                      </SelectItem>
                      {DIAS_DA_SEMANA.map((dia, indice) => (
                        <SelectItem key={dia} value={String(indice)}>
                          {dia}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Descontada da folha todo mês, sem precisar registrar.
                    Rodízio de sábado entra como ausência do tipo folga.
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
            form="entregador-form"
            className="w-full"
            disabled={salvar.isExecuting}
          >
            {salvar.isExecuting ? 'Salvando...' : 'Salvar diária'}
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
