'use client'

import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil, Plus } from 'lucide-react'
import { useAction } from 'next-safe-action/hooks'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@repo/ui/components/button'
import { Checkbox } from '@repo/ui/components/checkbox'
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
import { upsertBeneficioAction } from '../../lib/actions'
import { BENEFICIO_LABELS } from '../../lib/folha-helpers'
import {
  upsertBeneficioDefaultValues,
  upsertBeneficioSchema,
  type UpsertBeneficioInput,
} from '../../lib/schemas'
import { BENEFICIO_TIPOS, type Beneficio } from '../../lib/types'

export function BeneficioDrawer({
  funcionarioId,
  beneficio,
}: {
  funcionarioId: string
  beneficio?: Beneficio
}) {
  const [open, setOpen] = useState(false)
  const { direction, variant } = useDrawerDirection()
  const editando = beneficio != null

  const defaultValues: UpsertBeneficioInput = beneficio
    ? {
        id: beneficio.id,
        funcionarioId,
        tipo: beneficio.tipo,
        valor: beneficio.valor,
        recorrente: beneficio.recorrente,
        observacao: beneficio.observacao ?? '',
      }
    : upsertBeneficioDefaultValues(funcionarioId)

  const form = useForm<UpsertBeneficioInput>({
    resolver: zodResolver(upsertBeneficioSchema),
    defaultValues,
  })

  useEffect(() => {
    if (!open) form.reset(defaultValues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const salvar = useAction(upsertBeneficioAction, {
    onSuccess: () => {
      toast.success(editando ? 'Benefício atualizado' : 'Benefício adicionado')
      setOpen(false)
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? 'Não foi possível salvar')
    },
  })

  return (
    <Drawer direction={direction} open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        {editando ? (
          <Button variant="ghost" size="icon" aria-label="Editar benefício">
            <Pencil className="size-4" />
          </Button>
        ) : (
          <Button size="sm" className="w-full sm:w-auto">
            <Plus className="size-4" />
            Novo benefício
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
            {editando ? 'Editar benefício' : 'Novo benefício'}
          </DrawerTitle>
          <DrawerDescription>
            Benefício recorrente entra sozinho na folha de todo mês, como uma
            conta a pagar separada do salário.
          </DrawerDescription>
        </DrawerHeader>

        <Form {...form}>
          <form
            id="beneficio-form"
            onSubmit={form.handleSubmit((values) => salvar.execute(values))}
            className="flex flex-1 flex-col gap-6 px-4 py-6"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                        {BENEFICIO_TIPOS.map((tipo) => (
                          <SelectItem key={tipo} value={tipo}>
                            {BENEFICIO_LABELS[tipo]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                        className="h-11 tabular-nums sm:h-9"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="recorrente"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start gap-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="mt-0.5"
                    />
                  </FormControl>
                  <div className="flex flex-col gap-1">
                    <FormLabel className="cursor-pointer">
                      Entra na folha todo mês
                    </FormLabel>
                    <FormDescription>
                      Desmarque para um pagamento avulso, que você lança à mão.
                    </FormDescription>
                  </div>
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
                      placeholder="Ex: 2 conduções por dia"
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
            form="beneficio-form"
            className="w-full"
            disabled={salvar.isExecuting}
          >
            {salvar.isExecuting ? 'Salvando...' : 'Salvar benefício'}
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
