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

import {
  createFuncionarioAction,
  updateFuncionarioAction,
} from '../../lib/actions'
import {
  createFuncionarioDefaultValues,
  createFuncionarioSchema,
  type CreateFuncionarioInput,
} from '../../lib/schemas'
import type { EmpresaFuncionario } from '../../lib/types'

export function FuncionarioForm({
  empresaId,
  funcionario,
  open,
  onOpenChange,
}: {
  empresaId: string
  funcionario?: EmpresaFuncionario
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const defaultValues: CreateFuncionarioInput = funcionario
    ? {
        empresaId,
        nome: funcionario.nome,
        setor: funcionario.setor,
        turno: funcionario.turno,
        modalidade: funcionario.modalidade ?? '',
        status: funcionario.vinculoStatus,
      }
    : createFuncionarioDefaultValues(empresaId)

  const form = useForm<CreateFuncionarioInput>({
    resolver: zodResolver(createFuncionarioSchema),
    defaultValues,
  })

  useEffect(() => {
    if (!open) form.reset(defaultValues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const { execute: create } = useAction(createFuncionarioAction, {
    onSuccess: () => {
      toast.success('Funcionário cadastrado com sucesso')
      onOpenChange(false)
    },
    onError: () => {
      toast.error('Não foi possível cadastrar o funcionário')
    },
  })

  const { execute: update } = useAction(updateFuncionarioAction, {
    onSuccess: () => {
      toast.success('Funcionário atualizado com sucesso')
      onOpenChange(false)
    },
    onError: () => {
      toast.error('Não foi possível atualizar o funcionário')
    },
  })

  function onSubmit(values: CreateFuncionarioInput) {
    if (funcionario) {
      update({ ...values, id: funcionario.id })
    } else {
      create(values)
    }
  }

  return (
    <>
      <Form {...form}>
        <form
          id="funcionario-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-1 flex-col gap-6 px-4 py-6"
        >
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do funcionário" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="setor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Setor</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Administrativo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="turno"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Turno</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Almoço" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="modalidade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Modalidade</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="marmita">Marmita</SelectItem>
                      <SelectItem value="transport">Transporte</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </form>
      </Form>

      <DrawerFooter>
        <Button type="submit" form="funcionario-form" className="w-full">
          {funcionario ? 'Salvar alterações' : 'Salvar funcionário'}
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
