'use client'

import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAction } from 'next-safe-action/hooks'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@repo/ui/components/button'
import { DrawerFooter } from '@repo/ui/components/drawer'
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

import { hojeISO } from '@/lib/formatters'
import {
  createEstoqueItemAction,
  updateEstoqueItemAction,
} from '../../lib/actions'
import { UNIDADE_LABELS } from '../../lib/estoque-helpers'
import {
  createEstoqueItemSchema,
  updateEstoqueItemSchema,
  type CreateEstoqueItemInput,
  type UpdateEstoqueItemInput,
} from '../../lib/schemas'
import type { EstoqueItem } from '../../lib/types'
import { UNIDADES } from '../../lib/types'
import { formatQuantidade } from '../shared/quantidade'

export function EstoqueItemForm({
  item,
  open,
  onOpenChange,
}: {
  item?: EstoqueItem
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const editando = item != null
  const hoje = hojeISO()

  const defaultValuesCriar: CreateEstoqueItemInput = {
    nome: '',
    unidade: 'un',
    quantidadeAtual: 0,
    tamanhoEmbalagem: undefined,
    pontoReposicao: 0,
    validade: undefined,
  }

  const defaultValuesEditar: UpdateEstoqueItemInput = {
    id: item?.id ?? '',
    nome: item?.nome ?? '',
    unidade: item?.unidade ?? 'un',
    tamanhoEmbalagem: item?.tamanhoEmbalagem ?? undefined,
    pontoReposicao: item?.pontoReposicao ?? 0,
    validade: item?.validade ?? undefined,
    novoPreco: undefined,
    precoDataVigencia: hoje,
  }

  const formCriar = useForm<CreateEstoqueItemInput>({
    resolver: zodResolver(createEstoqueItemSchema),
    defaultValues: defaultValuesCriar,
  })

  const formEditar = useForm<UpdateEstoqueItemInput>({
    resolver: zodResolver(updateEstoqueItemSchema),
    defaultValues: defaultValuesEditar,
  })

  const unidadeCriar = formCriar.watch('unidade')

  // Quantidade inicial não se digita direto — a maioria dos itens chega em
  // embalagem fechada (garrafa de 900ml, saco de 5kg), então é mais natural
  // informar o tamanho da embalagem × quantas embalagens têm, e calcular o
  // total sozinho. Só existe no cadastro; editar não recalcula por multiplicação.
  const [tamanhoEmbalagemStr, setTamanhoEmbalagemStr] = useState('')
  const [numEmbalagens, setNumEmbalagens] = useState('')
  const totalEmbalagens =
    (Number(tamanhoEmbalagemStr) || 0) * (Number(numEmbalagens) || 0)

  useEffect(() => {
    if (!open) {
      formCriar.reset(defaultValuesCriar)
      formEditar.reset(defaultValuesEditar)
      setTamanhoEmbalagemStr('')
      setNumEmbalagens('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (editando) return
    formCriar.setValue('quantidadeAtual', totalEmbalagens, {
      shouldValidate: true,
    })
    formCriar.setValue(
      'tamanhoEmbalagem',
      tamanhoEmbalagemStr === '' ? undefined : Number(tamanhoEmbalagemStr),
      { shouldValidate: true }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalEmbalagens, tamanhoEmbalagemStr, editando])

  const criar = useAction(createEstoqueItemAction, {
    onSuccess: () => {
      toast.success('Item cadastrado')
      onOpenChange(false)
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? 'Não foi possível cadastrar o item')
    },
  })

  const editar = useAction(updateEstoqueItemAction, {
    onSuccess: () => {
      toast.success('Item atualizado')
      onOpenChange(false)
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? 'Não foi possível salvar o item')
    },
  })

  const salvando = criar.isExecuting || editar.isExecuting

  const novoPrecoEditar = formEditar.watch('novoPreco')

  return (
    <>
      {editando ? (
        <Form {...formEditar}>
          <form
            id="estoque-item-form"
            onSubmit={formEditar.handleSubmit((values) =>
              editar.execute(values)
            )}
            className="flex flex-1 flex-col gap-6 px-4 py-6"
          >
            <FormField
              control={formEditar.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do item</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Óleo de soja"
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
                control={formEditar.control}
                name="unidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade de medida</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-11 sm:h-9">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {UNIDADES.map((unidade) => (
                          <SelectItem key={unidade} value={unidade}>
                            {UNIDADE_LABELS[unidade]} ({unidade})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={formEditar.control}
                name="tamanhoEmbalagem"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tamanho da embalagem</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.001"
                        min="0"
                        inputMode="decimal"
                        placeholder="Ex: 900"
                        className="h-11 sm:h-9"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={formEditar.control}
              name="pontoReposicao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ponto de reposição</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.001"
                      min="0"
                      inputMode="decimal"
                      className="h-11 sm:h-9"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Quando a quantidade encostar nesse número, o item aparece
                    em &ldquo;Acabando&rdquo;. Deixe zero para não avisar.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={formEditar.control}
              name="validade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Validade (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      className="h-11 sm:h-9"
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormDescription>
                    Só para perecível. Avisamos 3 dias antes de vencer.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col gap-4 border-t pt-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={formEditar.control}
                  name="novoPreco"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Novo preço por {item?.unidade} (opcional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          inputMode="decimal"
                          placeholder="R$"
                          className="h-11 sm:h-9"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {novoPrecoEditar != null && novoPrecoEditar > 0 && (
                  <FormField
                    control={formEditar.control}
                    name="precoDataVigencia"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vigente a partir de</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            className="h-11 sm:h-9"
                            {...field}
                            value={field.value ?? hoje}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
              <FormDescription className="-mt-2">
                Preenchido, entra como uma linha nova no histórico de preço —
                nunca sobrescreve o anterior.
              </FormDescription>
            </div>
          </form>
        </Form>
      ) : (
        <Form {...formCriar}>
          <form
            id="estoque-item-form"
            onSubmit={formCriar.handleSubmit((values) => criar.execute(values))}
            className="flex flex-1 flex-col gap-6 px-4 py-6"
          >
            <FormField
              control={formCriar.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do item</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Óleo de soja"
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
                control={formCriar.control}
                name="unidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade de medida</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-11 sm:h-9">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {UNIDADES.map((unidade) => (
                          <SelectItem key={unidade} value={unidade}>
                            {UNIDADE_LABELS[unidade]} ({unidade})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel>Tamanho da embalagem</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.001"
                    min="0"
                    inputMode="decimal"
                    placeholder="Ex: 900"
                    className="h-11 sm:h-9"
                    value={tamanhoEmbalagemStr}
                    onChange={(e) => setTamanhoEmbalagemStr(e.target.value)}
                  />
                </FormControl>
              </FormItem>
            </div>

            <FormField
              control={formCriar.control}
              name="quantidadeAtual"
              render={() => (
                <FormItem>
                  <FormLabel>Quantidade inicial</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      inputMode="numeric"
                      placeholder="Quantas embalagens você tem"
                      className="h-11 sm:h-9"
                      value={numEmbalagens}
                      onChange={(e) => setNumEmbalagens(e.target.value)}
                    />
                  </FormControl>
                  <FormDescription>
                    Total em estoque:{' '}
                    <span className="font-medium text-foreground">
                      {formatQuantidade(totalEmbalagens)} {unidadeCriar}
                    </span>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={formCriar.control}
              name="pontoReposicao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ponto de reposição</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.001"
                      min="0"
                      inputMode="decimal"
                      className="h-11 sm:h-9"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Quando a quantidade encostar nesse número, o item aparece
                    em &ldquo;Acabando&rdquo;. Deixe zero para não avisar.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={formCriar.control}
              name="validade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Validade (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      className="h-11 sm:h-9"
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormDescription>
                    Só para perecível. Avisamos 3 dias antes de vencer.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      )}

      <DrawerFooter>
        <Button
          type="submit"
          form="estoque-item-form"
          className="w-full"
          disabled={salvando}
        >
          {salvando ? 'Salvando...' : editando ? 'Salvar item' : 'Cadastrar item'}
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
