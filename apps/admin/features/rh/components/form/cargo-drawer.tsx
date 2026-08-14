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
import { upsertCargoAction } from '../../lib/actions'
import {
  upsertCargoDefaultValues,
  upsertCargoSchema,
  type UpsertCargoInput,
} from '../../lib/schemas'
import type { Cargo } from '../../lib/types'

export function CargoDrawer({ cargo }: { cargo?: Cargo }) {
  const [open, setOpen] = useState(false)
  const { direction, variant } = useDrawerDirection()
  const editando = cargo != null

  const defaultValues: UpsertCargoInput = cargo
    ? {
        id: cargo.id,
        nome: cargo.nome,
        salarioBase: cargo.salarioBase,
        valorDiariaPadrao: cargo.valorDiariaPadrao ?? undefined,
      }
    : upsertCargoDefaultValues()

  const form = useForm<UpsertCargoInput>({
    resolver: zodResolver(upsertCargoSchema),
    defaultValues,
  })

  useEffect(() => {
    if (!open) form.reset(defaultValues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const salvar = useAction(upsertCargoAction, {
    onSuccess: () => {
      toast.success(editando ? 'Cargo atualizado' : 'Cargo criado')
      setOpen(false)
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? 'Não foi possível salvar o cargo')
    },
  })

  return (
    <Drawer direction={direction} open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        {editando ? (
          <Button variant="ghost" size="icon" aria-label="Editar cargo">
            <Pencil className="size-4" />
          </Button>
        ) : (
          <Button size="sm" className="w-full sm:w-auto">
            <Plus className="size-4" />
            Novo cargo
          </Button>
        )}
      </DrawerTrigger>
      <DrawerContent
        direction={direction}
        variant={variant}
        className="flex max-h-[85vh] w-full flex-col gap-0 overflow-y-auto sm:max-h-none sm:max-w-lg"
      >
        <DrawerHeader>
          <DrawerTitle>{editando ? 'Editar cargo' : 'Novo cargo'}</DrawerTitle>
          <DrawerDescription>
            Um cargo paga por mês, por diária, ou pelos dois — preencha o que
            se aplica.
          </DrawerDescription>
        </DrawerHeader>

        <Form {...form}>
          <form
            id="cargo-form"
            onSubmit={form.handleSubmit((values) => salvar.execute(values))}
            className="flex flex-1 flex-col gap-6 px-4 py-6"
          >
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do cargo</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Cozinheiro"
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
                name="salarioBase"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salário base (R$)</FormLabel>
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
                    <FormDescription>Por mês.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valorDiariaPadrao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Diária (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        inputMode="decimal"
                        placeholder="100"
                        className="h-11 tabular-nums sm:h-9"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Só em cargo que recebe por dia, como entregador.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <p className="-mt-2 text-sm text-muted-foreground">
              Os dois são só a sugestão que aparece ao admitir alguém neste
              cargo — cada pessoa pode ter o seu valor.
            </p>
          </form>
        </Form>

        <DrawerFooter>
          <Button
            type="submit"
            form="cargo-form"
            className="w-full"
            disabled={salvar.isExecuting}
          >
            {salvar.isExecuting
              ? 'Salvando...'
              : editando
                ? 'Salvar cargo'
                : 'Criar cargo'}
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
