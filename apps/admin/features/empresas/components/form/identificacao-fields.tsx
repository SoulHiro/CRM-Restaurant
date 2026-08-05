'use client'

import { Loader2 } from 'lucide-react'
import type { Control } from 'react-hook-form'

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
import { maskCnpj, maskPhone } from '@repo/ui/lib/masks'

import type { CreateEmpresaInput } from '../../lib/schemas'

export function IdentificacaoFields({
  control,
  isLookingUpCnpj,
}: {
  control: Control<CreateEmpresaInput>
  isLookingUpCnpj: boolean
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <FormField
        control={control}
        name="cnpj"
        render={({ field }) => (
          <FormItem>
            <FormLabel>CNPJ</FormLabel>
            <FormControl>
              <div className="relative">
                <Input
                  placeholder="00.000.000/0000-00"
                  {...field}
                  onChange={(e) => field.onChange(maskCnpj(e.target.value))}
                />
                {isLookingUpCnpj && (
                  <Loader2 className="absolute right-2.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                )}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="status"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Status</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
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

      <FormField
        control={control}
        name="nome"
        render={({ field }) => (
          <FormItem className="col-span-2">
            <FormLabel>Nome da empresa</FormLabel>
            <FormControl>
              <Input placeholder="Razão social" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="responsavelNome"
        render={({ field }) => (
          <FormItem className="col-span-2">
            <FormLabel>Responsável</FormLabel>
            <FormControl>
              <Input placeholder="Nome do responsável" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="emailContato"
        render={({ field }) => (
          <FormItem>
            <FormLabel>E-mail de contato</FormLabel>
            <FormControl>
              <Input
                type="email"
                placeholder="contato@empresa.com"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="telefoneContato"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Telefone de contato</FormLabel>
            <FormControl>
              <Input
                placeholder="(00) 00000-0000"
                {...field}
                onChange={(e) => field.onChange(maskPhone(e.target.value))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
