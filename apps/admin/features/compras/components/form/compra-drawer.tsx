'use client'

import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { useAction } from 'next-safe-action/hooks'
import { FormProvider, useForm } from 'react-hook-form'
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
import { SUBTIPO_LABELS } from '@/features/financeiro/lib/dre-helpers'
import { DESPESA_SUBTIPOS } from '@/features/financeiro/lib/types'
import { useDrawerDirection } from '@/hooks/use-drawer-direction'
import { createCompraAction } from '../../lib/actions'
import { calcularVencimento } from '../../lib/compra-helpers'
import {
  createCompraDefaultValues,
  createCompraSchema,
  type CompraLinhaInput,
  type CreateCompraInput,
} from '../../lib/schemas'
import type { FornecedorListItem } from '../../lib/types'
import { CompraLinhasEditor } from './compra-linhas-editor'

export function CompraDrawer({
  hoje,
  fornecedores,
  itens,
  precosPorFornecedor,
  linhasIniciais,
  fornecedorInicialId,
  gatilho,
}: {
  hoje: string
  fornecedores: FornecedorListItem[]
  itens: EstoqueItem[]
  precosPorFornecedor: Record<string, number>
  /** Vem preenchido quando a compra nasce da aba Sugestão. */
  linhasIniciais?: CompraLinhaInput[]
  fornecedorInicialId?: string
  gatilho?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const { direction, variant } = useDrawerDirection()

  const defaultValues: CreateCompraInput = {
    ...createCompraDefaultValues(hoje),
    fornecedorId: fornecedorInicialId ?? '',
    linhas: linhasIniciais ?? [],
  }

  const form = useForm<CreateCompraInput>({
    resolver: zodResolver(createCompraSchema),
    defaultValues,
  })

  useEffect(() => {
    if (!open) form.reset(defaultValues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const criar = useAction(createCompraAction, {
    onSuccess: () => {
      toast.success('Compra registrada — a conta a pagar já entrou no financeiro')
      setOpen(false)
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? 'Não foi possível registrar a compra')
    },
  })

  // Escolher o fornecedor já resolve o vencimento pelo prazo dele; quem quiser
  // outra data ainda edita o campo.
  function aoEscolherFornecedor(id: string) {
    form.setValue('fornecedorId', id, { shouldValidate: true })
    const escolhido = fornecedores.find((f) => f.id === id)
    form.setValue(
      'dataVencimento',
      calcularVencimento(form.getValues('dataPedido'), escolhido?.prazoPagamento)
    )
  }

  const semFornecedor = fornecedores.length === 0
  const semItens = itens.length === 0

  return (
    <Drawer direction={direction} open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        {gatilho ?? (
          <Button
            size="sm"
            className="w-full sm:w-auto"
            disabled={semFornecedor || semItens}
          >
            <Plus className="size-4" />
            Nova compra
          </Button>
        )}
      </DrawerTrigger>
      <DrawerContent
        direction={direction}
        variant={variant}
        className="flex max-h-[90vh] w-full flex-col gap-0 overflow-y-auto sm:max-h-none sm:max-w-2xl"
      >
        <DrawerHeader>
          <DrawerTitle>Nova compra</DrawerTitle>
          <DrawerDescription>
            Uma nota só: os itens dão entrada no estoque quando você marcar como
            recebida, e o valor já vira conta a pagar.
          </DrawerDescription>
        </DrawerHeader>

        <FormProvider {...form}>
          <form
            id="compra-form"
            onSubmit={form.handleSubmit((values) => criar.execute(values))}
            className="flex flex-1 flex-col gap-6 px-4 py-6"
          >
            <FormField
              control={form.control}
              name="fornecedorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fornecedor</FormLabel>
                  <Select value={field.value} onValueChange={aoEscolherFornecedor}>
                    <FormControl>
                      <SelectTrigger autoFocus className="h-11 sm:h-9">
                        <SelectValue placeholder="De quem você comprou" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {fornecedores.map((fornecedor) => (
                        <SelectItem key={fornecedor.id} value={fornecedor.id}>
                          {fornecedor.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <CompraLinhasEditor
              itens={itens}
              precosPorFornecedor={precosPorFornecedor}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="dataPedido"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data do pedido</FormLabel>
                    <FormControl>
                      <Input type="date" className="h-11 sm:h-9" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dataVencimento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pagamento vence em</FormLabel>
                    <FormControl>
                      <Input type="date" className="h-11 sm:h-9" {...field} />
                    </FormControl>
                    <FormDescription>
                      Preenchido pelo prazo do fornecedor.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="numeroNotaFiscal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número da nota (opcional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: 45821"
                        inputMode="numeric"
                        className="h-11 sm:h-9"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoriaDespesa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entra como que despesa?</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-11 sm:h-9">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DESPESA_SUBTIPOS.map((subtipo) => (
                          <SelectItem key={subtipo} value={subtipo}>
                            {SUBTIPO_LABELS[subtipo]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="formaPagamento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Forma de pagamento (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: boleto, pix, cartão"
                      className="h-11 sm:h-9"
                      {...field}
                      value={field.value ?? ''}
                    />
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
                      placeholder="Ex: faltou a caixa de tomate, vem depois"
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
        </FormProvider>

        <DrawerFooter>
          <Button
            type="submit"
            form="compra-form"
            className="w-full"
            disabled={criar.isExecuting}
          >
            {criar.isExecuting ? 'Registrando...' : 'Registrar compra'}
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
