'use client'

import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAction } from 'next-safe-action/hooks'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@repo/ui/components/button'
import { DrawerFooter } from '@repo/ui/components/drawer'
import { Form } from '@repo/ui/components/form'

import { useCepLookup } from '../../hooks/use-cep-lookup'
import { useCnpjLookup } from '../../hooks/use-cnpj-lookup'
import { createEmpresaAction } from '../../lib/actions'
import {
  createEmpresaDefaultValues,
  createEmpresaSchema,
  type CreateEmpresaInput,
} from '../../lib/schemas'
import { EnderecoFields } from './endereco-fields'
import { IdentificacaoFields } from './identificacao-fields'

export function CadastrarEmpresaForm({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const form = useForm<CreateEmpresaInput>({
    resolver: zodResolver(createEmpresaSchema),
    defaultValues: createEmpresaDefaultValues,
  })

  useEffect(() => {
    if (!open) form.reset(createEmpresaDefaultValues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const { execute } = useAction(createEmpresaAction, {
    onSuccess: () => {
      toast.success('Empresa cadastrada com sucesso')
      onOpenChange(false)
    },
    onError: () => {
      toast.error('Não foi possível cadastrar a empresa')
    },
  })

  const { isLoading: isLookingUpCnpj } = useCnpjLookup(
    form.watch('cnpj') ?? '',
    (nome) => {
      if (!form.getValues('nome')) {
        form.setValue('nome', nome, { shouldValidate: true })
      }
    }
  )

  const { isLoading: isLookingUpCep } = useCepLookup(
    form.watch('cep') ?? '',
    (data) => {
      if (data.logradouro) form.setValue('logradouro', data.logradouro)
      if (data.bairro) form.setValue('bairro', data.bairro)
      if (data.localidade) form.setValue('cidade', data.localidade)
      if (data.uf) form.setValue('uf', data.uf, { shouldValidate: true })
    }
  )

  function onSubmit(values: CreateEmpresaInput) {
    execute(values)
  }

  return (
    <>
      <Form {...form}>
        <form
          id="cadastrar-empresa-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-1 flex-col gap-6 px-4 py-6"
        >
          <IdentificacaoFields
            control={form.control}
            isLookingUpCnpj={isLookingUpCnpj}
          />
          <EnderecoFields
            control={form.control}
            isLookingUpCep={isLookingUpCep}
          />
        </form>
      </Form>

      <DrawerFooter>
        <Button type="submit" form="cadastrar-empresa-form" className="w-full">
          Salvar empresa
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
