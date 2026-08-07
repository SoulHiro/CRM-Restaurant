'use client'

import { useEffect } from 'react'
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

import { registrarPerdaAction } from '../../lib/actions'
import {
  registrarPerdaDefaultValues,
  registrarPerdaSchema,
  type RegistrarPerdaInput,
} from '../../lib/schemas'
import type { EstoqueItem, PerdaMotivo } from '../../lib/types'
import { formatQuantidade } from '../shared/quantidade'

const MOTIVO_LABELS: Record<PerdaMotivo, string> = {
  vencido: 'Venceu',
  quebra: 'Quebrou / estragou',
  erro_preparo: 'Erro no preparo',
  outro: 'Outro',
}

export function RegistrarPerdaForm({
  item,
  hoje,
  open,
  onOpenChange,
}: {
  item: EstoqueItem
  hoje: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const defaultValues = registrarPerdaDefaultValues(item.id, hoje)

  const form = useForm<RegistrarPerdaInput>({
    resolver: zodResolver(registrarPerdaSchema),
    defaultValues,
  })

  useEffect(() => {
    if (!open) form.reset(defaultValues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const { execute, isExecuting } = useAction(registrarPerdaAction, {
    onSuccess: () => {
      toast.success('Perda registrada — estoque atualizado')
      onOpenChange(false)
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? 'Não foi possível registrar a perda')
    },
  })

  const quantidade = Number(form.watch('quantidade')) || 0
  const saldoDepois = item.quantidadeAtual - quantidade

  return (
    <>
      <Form {...form}>
        <form
          id="registrar-perda-form"
          onSubmit={form.handleSubmit((values) => execute(values))}
          className="flex flex-1 flex-col gap-6 px-4 py-6"
        >
          <FormField
            control={form.control}
            name="quantidade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quanto se perdeu ({item.unidade})</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.001"
                    min="0"
                    inputMode="decimal"
                    autoFocus
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Em estoque: {formatQuantidade(item.quantidadeAtual)}{' '}
                  {item.unidade}
                  {quantidade > 0 && (
                    <>
                      {' → '}
                      <span
                        className={
                          saldoDepois < 0
                            ? 'font-medium text-destructive'
                            : 'font-medium text-foreground'
                        }
                      >
                        {formatQuantidade(saldoDepois)} {item.unidade}
                      </span>
                      {saldoDepois < 0 && ' (fica negativo)'}
                    </>
                  )}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="motivo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Motivo</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(
                      Object.keys(MOTIVO_LABELS) as PerdaMotivo[]
                    ).map((motivo) => (
                      <SelectItem key={motivo} value={motivo}>
                        {MOTIVO_LABELS[motivo]}
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
            name="data"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quando</FormLabel>
                <FormControl>
                  <Input type="date" max={hoje} {...field} />
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
                    placeholder="Ex: caixa caiu na descarga"
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
          form="registrar-perda-form"
          className="w-full"
          disabled={isExecuting}
        >
          {isExecuting ? 'Registrando...' : 'Registrar perda'}
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
