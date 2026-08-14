'use client'

import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { UserMinus, UserPlus } from 'lucide-react'
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
import {
  desligarFuncionarioAction,
  readmitirFuncionarioAction,
} from '../../lib/actions'
import {
  desligarFuncionarioSchema,
  type DesligarFuncionarioInput,
} from '../../lib/schemas'
import { MOTIVO_DESLIGAMENTO_LABELS } from '../../lib/salario-helpers'
import { MOTIVOS_DESLIGAMENTO, type FuncionarioListItem } from '../../lib/types'

export function DesligarFuncionarioButton({
  funcionario,
  hoje,
}: {
  funcionario: FuncionarioListItem
  hoje: string
}) {
  const [open, setOpen] = useState(false)
  const { direction, variant } = useDrawerDirection()

  const defaultValues: DesligarFuncionarioInput = {
    id: funcionario.id,
    dataDesligamento: hoje,
    motivo: 'pedido_demissao',
    observacao: '',
  }

  const form = useForm<DesligarFuncionarioInput>({
    resolver: zodResolver(desligarFuncionarioSchema),
    defaultValues,
  })

  useEffect(() => {
    if (!open) form.reset(defaultValues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const desligar = useAction(desligarFuncionarioAction, {
    onSuccess: () => {
      toast.success('Funcionário desligado')
      setOpen(false)
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? 'Não foi possível desligar')
    },
  })

  const readmitir = useAction(readmitirFuncionarioAction, {
    onSuccess: () => toast.success('Funcionário reativado'),
    onError: ({ error }) =>
      toast.error(error.serverError ?? 'Não foi possível reativar'),
  })

  if (funcionario.status === 'desligado') {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-full sm:w-auto"
        disabled={readmitir.isExecuting}
        onClick={() => readmitir.execute({ id: funcionario.id })}
      >
        <UserPlus className="size-4" />
        Reativar
      </Button>
    )
  }

  return (
    <Drawer direction={direction} open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full sm:w-auto">
          <UserMinus className="size-4" />
          Desligar
        </Button>
      </DrawerTrigger>
      <DrawerContent
        direction={direction}
        variant={variant}
        className="flex max-h-[85vh] w-full flex-col gap-0 overflow-y-auto sm:max-h-none sm:max-w-lg"
      >
        <DrawerHeader>
          <DrawerTitle>Desligar {funcionario.nome}</DrawerTitle>
          <DrawerDescription>
            Sai das folhas seguintes, mas continua no histórico com tudo que já
            foi pago — nada é apagado.
          </DrawerDescription>
        </DrawerHeader>

        <Form {...form}>
          <form
            id="desligar-form"
            onSubmit={form.handleSubmit((values) => desligar.execute(values))}
            className="flex flex-1 flex-col gap-6 px-4 py-6"
          >
            <FormField
              control={form.control}
              name="dataDesligamento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Último dia</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      autoFocus
                      className="h-11 sm:h-9"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Ainda entra na folha do mês em que saiu.
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
                      <SelectTrigger className="h-11 sm:h-9">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MOTIVOS_DESLIGAMENTO.map((motivo) => (
                        <SelectItem key={motivo} value={motivo}>
                          {MOTIVO_DESLIGAMENTO_LABELS[motivo]}
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
                      placeholder="Ex: avisou com 30 dias"
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
            form="desligar-form"
            className="w-full"
            disabled={desligar.isExecuting}
          >
            {desligar.isExecuting ? 'Desligando...' : 'Confirmar desligamento'}
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
