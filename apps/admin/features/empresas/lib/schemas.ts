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

export const createFuncionarioSchema = z.object({
  empresaId: z.string().min(1),
  nome: z.string().min(1, 'Informe o nome do funcionário'),
  setor: z.string().min(1, 'Informe o setor'),
  turno: z.string().min(1, 'Informe o turno'),
  modalidade: z.string().optional(),
  status: z.enum(['ativo', 'inativo']),
})

export type CreateFuncionarioInput = z.infer<typeof createFuncionarioSchema>

export function createFuncionarioDefaultValues(
  empresaId: string
): CreateFuncionarioInput {
  return {
    empresaId,
    nome: '',
    setor: '',
    turno: '',
    modalidade: '',
    status: 'ativo',
  }
}

export const updateFuncionarioSchema = createFuncionarioSchema.extend({
  id: z.string().min(1),
})

export type UpdateFuncionarioInput = z.infer<typeof updateFuncionarioSchema>

export const updateFuncionarioStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['ativo', 'inativo']),
})

export type UpdateFuncionarioStatusInput = z.infer<
  typeof updateFuncionarioStatusSchema
>

export const createPausaSchema = z.object({
  empresaId: z.string().min(1),
  data: z.string().min(1, 'Informe a data'),
  motivo: z.string().optional(),
})

export type CreatePausaInput = z.infer<typeof createPausaSchema>

export function createPausaDefaultValues(empresaId: string): CreatePausaInput {
  return {
    empresaId,
    data: '',
    motivo: '',
  }
}

export const deletePausaSchema = z.object({
  id: z.string().min(1),
})

export type DeletePausaInput = z.infer<typeof deletePausaSchema>

export const listarColaboradoresSchema = z.object({
  empresaId: z.string().min(1),
})

export type ListarColaboradoresInput = z.infer<typeof listarColaboradoresSchema>

export const obterImpressoraComandaSchema = z.object({})

export const listarPedidosDoDiaSchema = z.object({
  empresaId: z.string().min(1),
  data: z.string().min(1),
})

export type ListarPedidosDoDiaInput = z.infer<typeof listarPedidosDoDiaSchema>

const pedidoImportadoItemSchema = z.object({
  nome: z.string().min(1),
  colaboradorId: z.string().nullable(),
  whatsapp: z.string().nullable(),
  data: z.string().min(1),
  tipo: z.enum(['marmita', 'lanche']).default('marmita'),
  turno: z.enum(['almoco', 'jantar']).nullable(),
  tamanho: z.enum(['P', 'M', 'G']).nullable(),
  prato: z.string().nullable(),
  preco: z.number().min(0).nullable(),
  observacao: z.string().nullable(),
  respondidoEm: z.string().nullable(),
})

export type PedidoImportadoItemInput = z.infer<typeof pedidoImportadoItemSchema>

export const importarPedidosSchema = z.object({
  empresaId: z.string().min(1),
  arquivoOrigem: z.string().min(1),
  itens: z.array(pedidoImportadoItemSchema).min(1),
})

export type ImportarPedidosInput = z.infer<typeof importarPedidosSchema>

export const finalizarDiaSchema = z.object({
  empresaId: z.string().min(1),
  data: z.string().min(1),
  precoUnitarioP: z.number().min(0),
  precoUnitarioM: z.number().min(0),
  precoUnitarioG: z.number().min(0),
  quantidadeCafe: z.number().int().min(0),
  precoUnitarioCafe: z.number().min(0),
  quantidadeSuco: z.number().int().min(0),
  precoUnitarioSuco: z.number().min(0),
})

export type FinalizarDiaInput = z.infer<typeof finalizarDiaSchema>

export const obterFechamentoDoDiaSchema = z.object({
  empresaId: z.string().min(1),
  data: z.string().min(1),
})

export type ObterFechamentoDoDiaInput = z.infer<
  typeof obterFechamentoDoDiaSchema
>

export const reabrirDiaSchema = z.object({
  empresaId: z.string().min(1),
  data: z.string().min(1),
})

export type ReabrirDiaInput = z.infer<typeof reabrirDiaSchema>

export const listarFechamentosSchema = z.object({
  empresaId: z.string().min(1),
  from: z.string().nullable().optional(),
  to: z.string().nullable().optional(),
})

export type ListarFechamentosInput = z.infer<typeof listarFechamentosSchema>

export const listarFaturamentoMensalSchema = z.object({
  empresaId: z.string().min(1),
  from: z.string().nullable().optional(),
  to: z.string().nullable().optional(),
})

export type ListarFaturamentoMensalInput = z.infer<
  typeof listarFaturamentoMensalSchema
>

export const removerPedidoSchema = z.object({
  colaboradorId: z.string().min(1),
  data: z.string().min(1),
})

export type RemoverPedidoInput = z.infer<typeof removerPedidoSchema>

export const marcarRecusaSchema = z.object({
  colaboradorId: z.string().min(1),
  data: z.string().min(1),
  recusou: z.boolean(),
})

export type MarcarRecusaInput = z.infer<typeof marcarRecusaSchema>

const PRECO_PADRAO_TIPOS = [
  'marmita_p',
  'marmita_m',
  'marmita_g',
  'cafe',
  'suco',
  'lanche',
  'garrafa_cafe_adicional',
] as const

export const obterPrecosEmpresaSchema = z.object({
  empresaId: z.string().min(1),
})

export type ObterPrecosEmpresaInput = z.infer<typeof obterPrecosEmpresaSchema>

export const salvarPrecosEmpresaSchema = z.object({
  empresaId: z.string().min(1),
  itens: z.array(
    z.object({
      tipo: z.enum(PRECO_PADRAO_TIPOS),
      nome: z.string().min(1),
      preco: z.number().min(0),
    })
  ),
})

export type SalvarPrecosEmpresaInput = z.infer<typeof salvarPrecosEmpresaSchema>
