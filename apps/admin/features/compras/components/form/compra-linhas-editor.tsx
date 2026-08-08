'use client'

import { useRef } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form'

import { Button } from '@repo/ui/components/button'
import {
  FormControl,
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
import { formatCurrencyBRL } from '@/lib/formatters'
import { totalCompra, totalLinha } from '../../lib/compra-helpers'
import type { CreateCompraInput } from '../../lib/schemas'

const LINHA_VAZIA = { estoqueItemId: '', quantidade: 1, valorUnitario: 0 }

export function CompraLinhasEditor({
  itens,
  precosPorFornecedor,
}: {
  itens: EstoqueItem[]
  precosPorFornecedor: Record<string, number>
}) {
  const form = useFormContext<CreateCompraInput>()
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'linhas',
  })

  const linhas = useWatch({ control: form.control, name: 'linhas' }) ?? []
  const fornecedorId = useWatch({ control: form.control, name: 'fornecedorId' })
  const total = totalCompra(
    linhas.map((linha) => ({
      quantidade: Number(linha?.quantidade) || 0,
      valorUnitario: Number(linha?.valorUnitario) || 0,
    }))
  )

  // O foco tem que cair no campo da linha nova; sem isso cada item custa uma
  // ida ao mouse, e é a soma dessas idas que torna a nota lenta de lançar.
  const ultimaLinha = useRef<HTMLButtonElement>(null)

  function adicionarLinha() {
    append(LINHA_VAZIA)
    requestAnimationFrame(() => ultimaLinha.current?.focus())
  }

  function aoEscolherItem(indice: number, estoqueItemId: string) {
    form.setValue(`linhas.${indice}.estoqueItemId`, estoqueItemId, {
      shouldValidate: true,
    })

    const conhecido = precosPorFornecedor[`${fornecedorId}:${estoqueItemId}`]
    if (conhecido != null && !form.getValues(`linhas.${indice}.valorUnitario`)) {
      form.setValue(`linhas.${indice}.valorUnitario`, conhecido)
    }
  }

  const jaEscolhidos = new Set(
    linhas.map((linha) => linha?.estoqueItemId).filter(Boolean)
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <FormLabel className="text-sm">Itens da nota</FormLabel>
        <span className="text-xs text-muted-foreground">
          {fields.length === 0
            ? 'nenhum item'
            : `${fields.length} ${fields.length === 1 ? 'item' : 'itens'}`}
        </span>
      </div>

      {fields.length === 0 ? (
        <p className="rounded-lg bg-muted px-4 py-6 text-center text-sm text-muted-foreground">
          Adicione o que veio nessa nota. O total e a conta a pagar saem daqui.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {fields.map((field, indice) => {
            const linha = linhas[indice]
            const subtotal = totalLinha({
              quantidade: Number(linha?.quantidade) || 0,
              valorUnitario: Number(linha?.valorUnitario) || 0,
            })
            const unidade = itens.find(
              (item) => item.id === linha?.estoqueItemId
            )?.unidade

            return (
              <div
                key={field.id}
                className="flex flex-col gap-2 rounded-lg bg-muted p-3 sm:grid sm:grid-cols-[minmax(0,1fr)_5.5rem_6.5rem_auto] sm:items-end sm:gap-2"
              >
                <FormField
                  control={form.control}
                  name={`linhas.${indice}.estoqueItemId`}
                  render={({ field: campo }) => (
                    <FormItem className="min-w-0">
                      <FormLabel className="text-xs text-muted-foreground">
                        Item
                      </FormLabel>
                      <Select
                        value={campo.value}
                        onValueChange={(valor) => aoEscolherItem(indice, valor)}
                      >
                        <FormControl>
                          <SelectTrigger
                            ref={indice === fields.length - 1 ? ultimaLinha : undefined}
                            className="h-11 w-full sm:h-9"
                          >
                            <SelectValue placeholder="Escolher item" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {itens.map((item) => (
                            <SelectItem
                              key={item.id}
                              value={item.id}
                              disabled={
                                item.id !== campo.value &&
                                jaEscolhidos.has(item.id)
                              }
                            >
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

                <div className="grid grid-cols-2 gap-2 sm:contents">
                  <FormField
                    control={form.control}
                    name={`linhas.${indice}.quantidade`}
                    render={({ field: campo }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">
                          Qtd{unidade ? ` (${unidade})` : ''}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.001"
                            min="0"
                            inputMode="decimal"
                            className="h-11 tabular-nums sm:h-9"
                            {...campo}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`linhas.${indice}.valorUnitario`}
                    render={({ field: campo }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">
                          Valor un.
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            inputMode="decimal"
                            className="h-11 tabular-nums sm:h-9"
                            {...campo}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center justify-between gap-2 sm:h-9 sm:justify-end">
                  <span className="text-sm font-medium tabular-nums sm:sr-only">
                    {formatCurrencyBRL(subtotal)}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    aria-label={`Remover item ${indice + 1}`}
                    onClick={() => remove(indice)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        className="h-11 w-full sm:h-9"
        onClick={adicionarLinha}
      >
        <Plus className="size-4" />
        Adicionar item
      </Button>

      {form.formState.errors.linhas?.root && (
        <p className="text-sm font-medium text-destructive">
          {form.formState.errors.linhas.root.message}
        </p>
      )}

      <div className="flex items-baseline justify-between border-t border-border pt-3">
        <span className="text-sm text-muted-foreground">Total da nota</span>
        <span className="text-lg font-semibold tabular-nums">
          {formatCurrencyBRL(total)}
        </span>
      </div>
    </div>
  )
}
