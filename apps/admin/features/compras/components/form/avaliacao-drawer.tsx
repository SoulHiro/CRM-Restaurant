'use client'

import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Star } from 'lucide-react'
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
import { cn } from '@repo/ui/lib/utils'

import { useDrawerDirection } from '@/hooks/use-drawer-direction'
import { registrarAvaliacaoAction } from '../../lib/actions'
import { AVALIACAO_TIPO_LABEL } from '../../lib/fornecedor-helpers'
import {
  registrarAvaliacaoDefaultValues,
  registrarAvaliacaoSchema,
  type RegistrarAvaliacaoInput,
} from '../../lib/schemas'
import { AVALIACAO_TIPOS } from '../../lib/types'

export function AvaliacaoDrawer({
  fornecedorId,
  fornecedorNome,
  hoje,
}: {
  fornecedorId: string
  fornecedorNome: string
  hoje: string
}) {
  const [open, setOpen] = useState(false)
  const { direction, variant } = useDrawerDirection()

  const form = useForm<RegistrarAvaliacaoInput>({
    resolver: zodResolver(registrarAvaliacaoSchema),
    defaultValues: registrarAvaliacaoDefaultValues(fornecedorId, hoje),
  })

  useEffect(() => {
    if (!open) form.reset(registrarAvaliacaoDefaultValues(fornecedorId, hoje))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const registrar = useAction(registrarAvaliacaoAction, {
    onSuccess: () => {
      toast.success('Avaliação registrada')
      setOpen(false)
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? 'Não foi possível registrar')
    },
  })

  const nota = form.watch('nota')

  return (
    <Drawer direction={direction} open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button size="sm" variant="outline" className="w-full sm:w-auto">
          <Star className="size-4" />
          Avaliar
        </Button>
      </DrawerTrigger>
      <DrawerContent
        direction={direction}
        variant={variant}
        className="flex max-h-[85vh] w-full flex-col gap-0 overflow-y-auto sm:max-h-none sm:max-w-lg"
      >
        <DrawerHeader>
          <DrawerTitle>Avaliar {fornecedorNome}</DrawerTitle>
          <DrawerDescription>
            Anote agora o que deu errado — daqui a três meses a média é o que
            decide se vale trocar de fornecedor.
          </DrawerDescription>
        </DrawerHeader>

        <Form {...form}>
          <form
            id="avaliacao-form"
            onSubmit={form.handleSubmit((values) => registrar.execute(values))}
            className="flex flex-1 flex-col gap-6 px-4 py-6"
          >
            <FormField
              control={form.control}
              name="nota"
              render={() => (
                <FormItem>
                  <FormLabel>Nota</FormLabel>
                  <div
                    className="flex gap-1"
                    role="radiogroup"
                    aria-label="Nota de 1 a 5"
                  >
                    {[1, 2, 3, 4, 5].map((valor) => (
                      <button
                        key={valor}
                        type="button"
                        role="radio"
                        aria-checked={nota === valor}
                        aria-label={`${valor} de 5`}
                        className="cursor-pointer rounded-md p-1.5 transition-colors hover:bg-muted focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                        onClick={() =>
                          form.setValue('nota', valor, { shouldValidate: true })
                        }
                      >
                        <Star
                          className={cn(
                            'size-7',
                            valor <= nota
                              ? 'fill-primary text-primary'
                              : 'text-muted-foreground/40'
                          )}
                        />
                      </button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sobre o quê</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-11 sm:h-9">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {AVALIACAO_TIPOS.map((tipo) => (
                          <SelectItem key={tipo} value={tipo}>
                            {AVALIACAO_TIPO_LABEL[tipo]}
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
                      <Input type="date" className="h-11 sm:h-9" {...field} />
                    </FormControl>
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
                  <FormLabel>O que aconteceu (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: entregou 2 dias depois, sem avisar"
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
            form="avaliacao-form"
            className="w-full"
            disabled={registrar.isExecuting}
          >
            {registrar.isExecuting ? 'Registrando...' : 'Registrar avaliação'}
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
