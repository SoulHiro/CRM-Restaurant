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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select'

import type { EstoqueItem } from '@/features/estoque/lib/types'
import { useDrawerDirection } from '@/hooks/use-drawer-direction'
import { upsertFornecedorItemAction } from '../../lib/actions'
import {
  upsertFornecedorItemSchema,
  type UpsertFornecedorItemInput,
} from '../../lib/schemas'
import type { FornecedorItemPreco } from '../../lib/types'

export function FornecedorItemDrawer({
  fornecedorId,
  itens,
  oferta,
}: {
  fornecedorId: string
  itens: EstoqueItem[]
  oferta?: FornecedorItemPreco
}) {
  const [open, setOpen] = useState(false)
  const { direction, variant } = useDrawerDirection()
  const editando = oferta != null

  const defaultValues: UpsertFornecedorItemInput = oferta
    ? {
        id: oferta.id,
        fornecedorId,
        estoqueItemId: oferta.estoqueItemId,
        preco: oferta.preco,
        prazoEntregaDias: oferta.prazoEntregaDias ?? undefined,
        observacao: oferta.observacao ?? '',
      }
    : {
        fornecedorId,
        estoqueItemId: '',
        preco: 0,
        prazoEntregaDias: undefined,
        observacao: '',
      }

  const form = useForm<UpsertFornecedorItemInput>({
    resolver: zodResolver(upsertFornecedorItemSchema),
    defaultValues,
  })

  useEffect(() => {
    if (!open) form.reset(defaultValues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const salvar = useAction(upsertFornecedorItemAction, {
    onSuccess: () => {
      toast.success('Preço salvo')
      setOpen(false)
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? 'Não foi possível salvar o preço')
    },
  })

  return (
    <Drawer direction={direction} open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        {editando ? (
          <Button variant="ghost" size="icon" aria-label="Editar preço">
            <Pencil className="size-4" />
          </Button>
        ) : (
          <Button size="sm" className="w-full sm:w-auto">
            <Plus className="size-4" />
            Novo preço
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
            {editando ? 'Editar preço' : 'Preço deste fornecedor'}
          </DrawerTitle>
          <DrawerDescription>
            É o que permite comparar antes de comprar e ter plano B quando o
            fornecedor habitual falta.
          </DrawerDescription>
        </DrawerHeader>

        <Form {...form}>
          <form
            id="fornecedor-item-form"
            onSubmit={form.handleSubmit((values) => salvar.execute(values))}
            className="flex flex-1 flex-col gap-6 px-4 py-6"
          >
            <FormField
              control={form.control}
              name="estoqueItemId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={editando}
                  >
                    <FormControl>
                      <SelectTrigger autoFocus className="h-11 sm:h-9">
                        <SelectValue placeholder="Escolher item" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {itens.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.nome}
                          {item.tamanhoEmbalagem
                            ? ` (${item.tamanhoEmbalagem}${item.unidade})`
                            : ''}
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
                name="preco"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço (R$)</FormLabel>
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
                      Desempata quando dois cobram o mesmo.
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
                      placeholder="Ex: só entrega acima de 10 caixas"
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
            form="fornecedor-item-form"
            className="w-full"
            disabled={salvar.isExecuting}
          >
            {salvar.isExecuting ? 'Salvando...' : 'Salvar preço'}
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
