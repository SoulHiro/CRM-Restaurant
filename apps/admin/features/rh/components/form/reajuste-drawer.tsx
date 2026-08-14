'use client'

import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { TrendingUp } from 'lucide-react'
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
import { formatCurrencyBRL } from '@/lib/formatters'
import { registrarSalarioAction } from '../../lib/actions'
import {
  registrarSalarioDefaultValues,
  registrarSalarioSchema,
  type RegistrarSalarioInput,
} from '../../lib/schemas'
import { MOTIVO_SALARIO_LABELS } from '../../lib/salario-helpers'
import { MOTIVOS_SALARIO } from '../../lib/types'

export function ReajusteDrawer({
  funcionarioId,
  funcionarioNome,
  salarioAtual,
  hoje,
}: {
  funcionarioId: string
  funcionarioNome: string
  salarioAtual: number | null
  hoje: string
}) {
  const [open, setOpen] = useState(false)
  const { direction, variant } = useDrawerDirection()

  const form = useForm<RegistrarSalarioInput>({
    resolver: zodResolver(registrarSalarioSchema),
    defaultValues: registrarSalarioDefaultValues(funcionarioId, hoje),
  })

  useEffect(() => {
    if (!open) form.reset(registrarSalarioDefaultValues(funcionarioId, hoje))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const registrar = useAction(registrarSalarioAction, {
    onSuccess: () => {
      toast.success('Reajuste registrado')
      setOpen(false)
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? 'Não foi possível registrar')
    },
  })

  const novoValor = form.watch('valor')
  const diferenca =
    salarioAtual != null && novoValor > 0 ? novoValor - salarioAtual : null

  return (
    <Drawer direction={direction} open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm" className="w-full sm:w-auto">
          <TrendingUp className="size-4" />
          Reajuste
        </Button>
      </DrawerTrigger>
      <DrawerContent
        direction={direction}
        variant={variant}
        className="flex max-h-[85vh] w-full flex-col gap-0 overflow-y-auto sm:max-h-none sm:max-w-lg"
      >
        <DrawerHeader>
          <DrawerTitle>Novo salário de {funcionarioNome}</DrawerTitle>
          <DrawerDescription>
            Entra como vigência nova — o valor anterior continua no histórico, e
            as folhas já fechadas não mudam.
          </DrawerDescription>
        </DrawerHeader>

        <Form {...form}>
          <form
            id="reajuste-form"
            onSubmit={form.handleSubmit((values) => registrar.execute(values))}
            className="flex flex-1 flex-col gap-6 px-4 py-6"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Novo salário (R$)</FormLabel>
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
                    <FormDescription>
                      {salarioAtual == null
                        ? 'Sem salário registrado ainda.'
                        : `Hoje é ${formatCurrencyBRL(salarioAtual)}.`}
                      {diferenca != null && diferenca !== 0 && (
                        <span
                          className={
                            diferenca > 0
                              ? 'ml-1 font-medium text-emerald-600 dark:text-emerald-400'
                              : 'ml-1 font-medium text-destructive'
                          }
                        >
                          {diferenca > 0 ? '+' : '−'}
                          {formatCurrencyBRL(Math.abs(diferenca))}
                        </span>
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vigenteDesde"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vale a partir de</FormLabel>
                    <FormControl>
                      <Input type="date" className="h-11 sm:h-9" {...field} />
                    </FormControl>
                    <FormDescription>
                      A folha do mês usa o valor vigente no último dia dele.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="motivo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="h-11 sm:h-9">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MOTIVOS_SALARIO.map((motivo) => (
                        <SelectItem key={motivo} value={motivo}>
                          {MOTIVO_SALARIO_LABELS[motivo]}
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
              name="observacao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observação (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: dissídio da categoria"
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
            form="reajuste-form"
            className="w-full"
            disabled={registrar.isExecuting}
          >
            {registrar.isExecuting ? 'Registrando...' : 'Registrar reajuste'}
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
