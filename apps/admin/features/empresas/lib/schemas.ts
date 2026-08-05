import { z } from 'zod'

import { onlyDigits } from '@repo/ui/lib/masks'

export const UFS = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
]

export const createEmpresaSchema = z.object({
  cnpj: z
    .string()
    .min(1, 'Informe o CNPJ')
    .refine((value) => onlyDigits(value).length === 14, 'CNPJ inválido'),
  nome: z.string().min(1, 'Informe o nome da empresa'),
  responsavelNome: z.string().optional(),
  emailContato: z
    .string()
    .email('E-mail inválido')
    .optional()
    .or(z.literal('')),
  telefoneContato: z.string().optional(),
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().optional(),
  status: z.enum(['ativo', 'inativo']),
})

export type CreateEmpresaInput = z.infer<typeof createEmpresaSchema>

export const createEmpresaDefaultValues: CreateEmpresaInput = {
  cnpj: '',
  nome: '',
  responsavelNome: '',
  emailContato: '',
  telefoneContato: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: '',
  status: 'ativo',
}
