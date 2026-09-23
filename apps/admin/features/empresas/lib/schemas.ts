import { z } from 'zod'

import { onlyDigits } from '@repo/ui/lib/masks'

const TURNOS_REFEICAO = [
  'almoco',
  'jantar',
  '1_turno',
  '2_turno',
  '3_turno',
  'administrativo',
] as const

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

export const createEmpresaSchema = z
  .object({
    tipo: z.enum(['pessoa_juridica', 'pessoa_fisica']),
    cnpj: z.string().optional(),
    nome: z.string().min(1, 'Informe o nome'),
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
  // CNPJ só é exigido/validado pra pessoa jurídica — pessoa física não tem.
  .refine(
    (v) =>
      v.tipo !== 'pessoa_juridica' ||
      (v.cnpj != null && onlyDigits(v.cnpj).length === 14),
    { message: 'CNPJ inválido', path: ['cnpj'] }
  )

export type CreateEmpresaInput = z.infer<typeof createEmpresaSchema>

export const createEmpresaDefaultValues: CreateEmpresaInput = {
  tipo: 'pessoa_juridica',
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

export const listarColaboradoresEmpresaSchema = z.object({
  empresaId: z.string().min(1),
})

export type ListarColaboradoresEmpresaInput = z.infer<
  typeof listarColaboradoresEmpresaSchema
>

export const atualizarColaboradorAtivoSchema = z.object({
  colaboradorId: z.string().min(1),
  ativo: z.boolean(),
})

export type AtualizarColaboradorAtivoInput = z.infer<
  typeof atualizarColaboradorAtivoSchema
>

export const atualizarColaboradorSeparadoSchema = z.object({
  colaboradorId: z.string().min(1),
  separado: z.boolean(),
})

export type AtualizarColaboradorSeparadoInput = z.infer<
  typeof atualizarColaboradorSeparadoSchema
>

export const atualizarColaboradorFeriasSchema = z.object({
  colaboradorId: z.string().min(1),
  emFerias: z.boolean(),
})

export type AtualizarColaboradorFeriasInput = z.infer<
  typeof atualizarColaboradorFeriasSchema
>

export const atualizarColaboradorNomeSchema = z.object({
  colaboradorId: z.string().min(1),
  nome: z.string().trim().min(1, 'Nome não pode ficar em branco'),
})

export type AtualizarColaboradorNomeInput = z.infer<
  typeof atualizarColaboradorNomeSchema
>

export const atualizarColaboradorTipoSchema = z.object({
  colaboradorId: z.string().min(1),
  tipo: z.enum(['funcionario', 'visitante']),
})

export type AtualizarColaboradorTipoInput = z.infer<
  typeof atualizarColaboradorTipoSchema
>

export const atualizarConfiguracaoEmpresaSchema = z.object({
  empresaId: z.string().min(1),
  fluxoPedido: z.enum(['padrao', 'pesagem']),
  resumoMostraQuantidades: z.boolean(),
  precoModo: z.enum(['por_tamanho', 'unico']),
  pedeCafe: z.boolean(),
  pedeLanche: z.boolean(),
  pedeSuco: z.boolean(),
  cardapioQtdAlternativas: z.number().int().min(0).max(30),
})

export type AtualizarConfiguracaoEmpresaInput = z.infer<
  typeof atualizarConfiguracaoEmpresaSchema
>

export const atualizarSlugEmpresaSchema = z.object({
  empresaId: z.string().min(1),
  slug: z
    .string()
    .min(3, 'Mínimo de 3 caracteres')
    .max(60)
    .regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      'Só letras minúsculas, números e hífen — sem espaço ou acento'
    ),
})

export type AtualizarSlugEmpresaInput = z.infer<
  typeof atualizarSlugEmpresaSchema
>

export const atualizarAvisoCardapioSchema = z.object({
  empresaId: z.string().min(1),
  // String vazia é uma escolha válida (apaga o aviso) — só `null` no banco é
  // o estado "nunca configurado", diferença que não importa pra quem chama.
  avisoCardapio: z.string().max(500),
})

export type AtualizarAvisoCardapioInput = z.infer<
  typeof atualizarAvisoCardapioSchema
>

export const atualizarColaboradoresSeparadosSchema = z.object({
  atualizacoes: z
    .array(
      z.object({
        colaboradorId: z.string().min(1),
        separado: z.boolean(),
      })
    )
    .min(1),
})

export type AtualizarColaboradoresSeparadosInput = z.infer<
  typeof atualizarColaboradoresSeparadosSchema
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

export const obterImpressoraPesagemSchema = z.object({})

export const listarPedidosDoDiaSchema = z.object({
  empresaId: z.string().min(1),
  data: z.string().min(1),
})

export type ListarPedidosDoDiaInput = z.infer<typeof listarPedidosDoDiaSchema>

const pedidoImportadoItemSchema = z.object({
  nome: z.string().min(1),
  colaboradorId: z.string().nullable(),
  whatsapp: z.string().nullable(),
  // Só importa pra colaborador novo (colaboradorId nulo) — ignorado se o
  // colaborador já existe, o tipo dele não muda por causa de um pedido novo.
  colaboradorTipo: z.enum(['funcionario', 'visitante']).default('funcionario'),
  data: z.string().min(1),
  tipo: z.enum(['marmita', 'lanche']).default('marmita'),
  turno: z.enum(TURNOS_REFEICAO).nullable(),
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
  // Só usado quando empresa.preco_modo = 'unico' — ignorado no modo padrão.
  precoUnitarioMarmitaUnica: z.number().min(0).default(0),
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
  pedidoId: z.string().min(1),
})

export type RemoverPedidoInput = z.infer<typeof removerPedidoSchema>

export const removerPedidosSchema = z.object({
  pedidoIds: z.array(z.string().min(1)).min(1),
})

export type RemoverPedidosInput = z.infer<typeof removerPedidosSchema>

export const marcarRecusaSchema = z.object({
  pedidoId: z.string().min(1),
  recusou: z.boolean(),
})

export type MarcarRecusaInput = z.infer<typeof marcarRecusaSchema>

export const atualizarPedidoSchema = z.object({
  pedidoId: z.string().min(1),
  prato: z.string().min(1, 'Informe o prato'),
  turno: z.enum(TURNOS_REFEICAO).nullable(),
  tamanho: z.enum(['P', 'M', 'G']).nullable(),
  observacao: z.string().nullable(),
})

export type AtualizarPedidoInput = z.infer<typeof atualizarPedidoSchema>

export const marcarPedidosImpressosSchema = z.object({
  pedidoIds: z.array(z.string().min(1)).min(1),
})

export type MarcarPedidosImpressosInput = z.infer<
  typeof marcarPedidosImpressosSchema
>

export const atualizarPrecoPedidoSchema = z.object({
  pedidoId: z.string().min(1),
  // null = volta a usar o preço padrão (o do tamanho, decidido no
  // "Finalizar dia") — só marmita tem padrão pra voltar; lanche sem preço
  // próprio zera.
  preco: z.number().min(0).nullable(),
})

export type AtualizarPrecoPedidoInput = z.infer<
  typeof atualizarPrecoPedidoSchema
>

const PRECO_PADRAO_TIPOS = [
  'marmita_p',
  'marmita_m',
  'marmita_g',
  'marmita_unica',
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
