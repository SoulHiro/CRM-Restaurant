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
import { upsertFornecedorAction } from '../../lib/actions'
import {
  upsertFornecedorDefaultValues,
  upsertFornecedorSchema,
  type UpsertFornecedorInput,
} from '../../lib/schemas'
import type { FornecedorListItem } from '../../lib/types'

export function FornecedorDrawer({
  fornecedor,
  comRotulo,
}: {
  fornecedor?: FornecedorListItem
  /** No cabeçalho do detalhe, ao lado de outros botões com texto. */
  comRotulo?: boolean
}) {
  const [open, setOpen] = useState(false)
  const { direction, variant } = useDrawerDirection()
  const editando = fornecedor != null

  const defaultValues: UpsertFornecedorInput = fornecedor
    ? {
        id: fornecedor.id,
        nome: fornecedor.nome,
        contato: fornecedor.contato ?? '',
        prazoEntregaDias: fornecedor.prazoEntregaDias ?? undefined,
        prazoPagamento: fornecedor.prazoPagamento ?? '',
      }
    : upsertFornecedorDefaultValues()

  const form = useForm<UpsertFornecedorInput>({
    resolver: zodResolver(upsertFornecedorSchema),
    defaultValues,
  })

  useEffect(() => {
    if (!open) form.reset(defaultValues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const salvar = useAction(upsertFornecedorAction, {
    onSuccess: () => {
      toast.success(editando ? 'Fornecedor atualizado' : 'Fornecedor cadastrado')
      setOpen(false)
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? 'Não foi possível salvar o fornecedor')
    },
  })

  return (
    <Drawer direction={direction} open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        {editando ? (
          comRotulo ? (
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              <Pencil className="size-4" />
              Editar
            </Button>
          ) : (
            <Button variant="ghost" size="icon" aria-label="Editar fornecedor">
              <Pencil className="size-4" />
            </Button>
          )
        ) : (
          <Button size="sm" className="w-full sm:w-auto">
            <Plus className="size-4" />
            Novo fornecedor
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
            {editando ? 'Editar fornecedor' : 'Novo fornecedor'}
          </DrawerTitle>
          <DrawerDescription>
            Os prazos daqui preenchem sozinhos o vencimento e o alerta de
            entrega atrasada nas próximas compras.
          </DrawerDescription>
        </DrawerHeader>

        <Form {...form}>
          <form
            id="fornecedor-form"
            onSubmit={form.handleSubmit((values) => salvar.execute(values))}
            className="flex flex-1 flex-col gap-6 px-4 py-6"
          >
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Atacadão Central"
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
              name="contato"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contato (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: (11) 99999-0000 — Seu Zé"
                      className="h-11 sm:h-9"
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
                name="prazoEntregaDias"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entrega em (dias)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        inputMode="numeric"
                        placeholder="3"
                        className="h-11 tabular-nums sm:h-9"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Passou disso, a compra aparece como atrasada.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="prazoPagamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prazo de pagamento</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: 30 dias"
                        className="h-11 sm:h-9"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Vira a data de vencimento da conta.
                    </FormDescription>
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
            form="fornecedor-form"
            className="w-full"
            disabled={salvar.isExecuting}
          >
            {salvar.isExecuting
              ? 'Salvando...'
              : editando
                ? 'Salvar fornecedor'
                : 'Cadastrar fornecedor'}
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
