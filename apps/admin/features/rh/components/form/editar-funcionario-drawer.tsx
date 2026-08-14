'use client'

import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil } from 'lucide-react'
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
import { mascararCpf } from '@/lib/cpf'
import { editarFuncionarioAction } from '../../lib/actions'
import {
  editarFuncionarioSchema,
  type EditarFuncionarioInput,
} from '../../lib/schemas'
import { MODELO_LABELS, TURNO_LABELS } from '../../lib/salario-helpers'
import {
  MODELOS_CONTRATUAIS,
  TURNOS_TRABALHO,
  type Cargo,
  type FuncionarioListItem,
} from '../../lib/types'

export function EditarFuncionarioDrawer({
  funcionario,
  cargos,
}: {
  funcionario: FuncionarioListItem
  cargos: Cargo[]
}) {
  const [open, setOpen] = useState(false)
  const { direction, variant } = useDrawerDirection()

  const defaultValues: EditarFuncionarioInput = {
    id: funcionario.id,
    nome: funcionario.nome,
    cpf: '',
    cnpj: funcionario.cnpj ?? '',
    cargoId: funcionario.cargoId,
    turno: funcionario.turno,
    modeloContratual: funcionario.modeloContratual,
    dataAdmissao: funcionario.dataAdmissao,
  }

  const form = useForm<EditarFuncionarioInput>({
    resolver: zodResolver(editarFuncionarioSchema),
    defaultValues,
  })

  useEffect(() => {
    if (!open) form.reset(defaultValues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const salvar = useAction(editarFuncionarioAction, {
    onSuccess: () => {
      toast.success('Funcionário atualizado')
      setOpen(false)
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? 'Não foi possível salvar')
    },
  })

  const modelo = form.watch('modeloContratual')
  const precisaCnpj = modelo === 'PJ' || modelo === 'MEI'

  return (
    <Drawer direction={direction} open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm" className="w-full sm:w-auto">
          <Pencil className="size-4" />
          Editar
        </Button>
      </DrawerTrigger>
      <DrawerContent
        direction={direction}
        variant={variant}
        className="flex max-h-[85vh] w-full flex-col gap-0 overflow-y-auto sm:max-h-none sm:max-w-lg"
      >
        <DrawerHeader>
          <DrawerTitle>Editar {funcionario.nome}</DrawerTitle>
          <DrawerDescription>
            Cadastro e vínculo. Salário não mexe aqui — use
            &ldquo;Registrar reajuste&rdquo;, que guarda a vigência.
          </DrawerDescription>
        </DrawerHeader>

        <Form {...form}>
          <form
            id="editar-funcionario-form"
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
                    <Input autoFocus className="h-11 sm:h-9" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="cargoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cargo</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-11 sm:h-9">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {cargos.map((cargo) => (
                          <SelectItem key={cargo.id} value={cargo.id}>
                            {cargo.nome}
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
                name="dataAdmissao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admitido em</FormLabel>
                    <FormControl>
                      <Input type="date" className="h-11 sm:h-9" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="turno"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Turno</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-11 sm:h-9">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TURNOS_TRABALHO.map((turno) => (
                          <SelectItem key={turno} value={turno}>
                            {TURNO_LABELS[turno]}
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
                name="modeloContratual"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vínculo</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-11 sm:h-9">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MODELOS_CONTRATUAIS.map((valor) => (
                          <SelectItem key={valor} value={valor}>
                            {MODELO_LABELS[valor]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={
                          funcionario.cpfFinal
                            ? mascararCpf(funcionario.cpfFinal)
                            : 'Nenhum cadastrado'
                        }
                        inputMode="numeric"
                        className="h-11 tabular-nums sm:h-9"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Em branco mantém o que já está guardado.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {precisaCnpj && (
                <FormField
                  control={form.control}
                  name="cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNPJ</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="00.000.000/0001-00"
                          inputMode="numeric"
                          className="h-11 tabular-nums sm:h-9"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </form>
        </Form>

        <DrawerFooter>
          <Button
            type="submit"
            form="editar-funcionario-form"
            className="w-full"
            disabled={salvar.isExecuting}
          >
            {salvar.isExecuting ? 'Salvando...' : 'Salvar'}
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
