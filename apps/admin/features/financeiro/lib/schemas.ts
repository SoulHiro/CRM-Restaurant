import { z } from 'zod'

import {
  DESPESA_CATEGORIAS,
  DESPESA_SUBTIPOS,
  META_TIPOS,
  TRANSACAO_ORIGENS,
  TRANSACAO_TIPOS,
} from './types'

const dinheiro = z.coerce
  .number({ invalid_type_error: 'Informe um valor' })
  .min(0, 'Não pode ser negativo')
  .max(99_999_999, 'Valor alto demais')

const dinheiroPositivo = dinheiro.refine(
  (value) => value > 0,
  'Informe um valor maior que zero'
)

export const createTransacaoSchema = z
  .object({
    tipo: z.enum(TRANSACAO_TIPOS),
    origem: z.enum(TRANSACAO_ORIGENS),
    valor: dinheiroPositivo,
    data: z.string().min(1, 'Informe a data'),
    descricao: z.string().min(1, 'Descreva o lançamento'),
    categoria: z.enum(DESPESA_CATEGORIAS).optional(),
    subtipo: z.enum(DESPESA_SUBTIPOS).optional(),
  })
  // Categoria e subtipo são o que permite separar custo fixo de variável no
  // DRE — sem isso não dá pra saber o ponto de equilíbrio.
  .refine((v) => v.tipo !== 'despesa' || v.categoria != null, {
    message: 'Toda despesa precisa ser fixa ou variável',
    path: ['categoria'],
  })
  .refine((v) => v.tipo !== 'despesa' || v.subtipo != null, {
    message: 'Escolha o tipo da despesa',
    path: ['subtipo'],
  })

export type CreateTransacaoInput = z.infer<typeof createTransacaoSchema>

export function createTransacaoDefaultValues(
  hoje: string
): CreateTransacaoInput {
  return {
    tipo: 'receita',
    origem: 'manual',
    valor: 0,
    data: hoje,
    descricao: '',
    categoria: undefined,
    subtipo: undefined,
  }
}

export const updateTransacaoSchema = z.object({
  id: z.string().min(1),
  tipo: z.enum(TRANSACAO_TIPOS),
  origem: z.enum(TRANSACAO_ORIGENS),
  valor: dinheiroPositivo,
  data: z.string().min(1, 'Informe a data'),
  descricao: z.string().min(1, 'Descreva o lançamento'),
  categoria: z.enum(DESPESA_CATEGORIAS).optional(),
  subtipo: z.enum(DESPESA_SUBTIPOS).optional(),
})

export type UpdateTransacaoInput = z.infer<typeof updateTransacaoSchema>

export const idSchema = z.object({ id: z.string().min(1) })
export type IdInput = z.infer<typeof idSchema>

export const createContaPagarSchema = z.object({
  descricao: z.string().min(1, 'Descreva a conta'),
  categoria: z.enum(DESPESA_CATEGORIAS),
  subtipo: z.enum(DESPESA_SUBTIPOS),
  valor: dinheiroPositivo,
  dataVencimento: z.string().min(1, 'Informe o vencimento'),
  observacao: z.string().optional(),
})

export type CreateContaPagarInput = z.infer<typeof createContaPagarSchema>

export function createContaPagarDefaultValues(
  hoje: string
): CreateContaPagarInput {
  return {
    descricao: '',
    categoria: 'fixa',
    subtipo: 'aluguel',
    valor: 0,
    dataVencimento: hoje,
    observacao: '',
  }
}

export const updateContaPagarSchema = createContaPagarSchema.extend({
  id: z.string().min(1),
})
export type UpdateContaPagarInput = z.infer<typeof updateContaPagarSchema>

export const createContaReceberSchema = z.object({
  empresaNome: z.string().min(1, 'Informe a empresa'),
  periodo: z.string().min(1, 'Informe o período'),
  valor: dinheiroPositivo,
  dataVencimento: z.string().min(1, 'Informe o vencimento'),
  observacao: z.string().optional(),
})

export type CreateContaReceberInput = z.infer<typeof createContaReceberSchema>

export function createContaReceberDefaultValues(
  hoje: string,
  periodo: string
): CreateContaReceberInput {
  return {
    empresaNome: '',
    periodo,
    valor: 0,
    dataVencimento: hoje,
    observacao: '',
  }
}

export const updateContaReceberSchema = createContaReceberSchema.extend({
  id: z.string().min(1),
})
export type UpdateContaReceberInput = z.infer<typeof updateContaReceberSchema>

export const marcarPagaSchema = z.object({
  id: z.string().min(1),
  dataPagamento: z.string().min(1, 'Informe a data do pagamento'),
})
export type MarcarPagaInput = z.infer<typeof marcarPagaSchema>

export const upsertMetaSchema = z
  .object({
    id: z.string().optional(),
    descricao: z.string().min(1, 'Descreva a meta'),
    tipo: z.enum(META_TIPOS),
    valorAlvo: dinheiro.optional(),
    inicio: z.string().min(1, 'Informe o início'),
    prazo: z.string().min(1, 'Informe o prazo'),
  })
  .refine((v) => v.tipo !== 'financeira' || (v.valorAlvo ?? 0) > 0, {
    message: 'Meta financeira precisa de um valor alvo',
    path: ['valorAlvo'],
  })
  .refine((v) => v.prazo > v.inicio, {
    message: 'O prazo tem que ser depois do início',
    path: ['prazo'],
  })

export type UpsertMetaInput = z.infer<typeof upsertMetaSchema>

export const registrarAjusteMetaSchema = z.object({
  metaId: z.string().min(1),
  // Pode ser negativo: retirada emergencial também é ajuste.
  valor: z.coerce
    .number({ invalid_type_error: 'Informe um valor' })
    .refine((v) => v !== 0, 'Informe um valor diferente de zero'),
  data: z.string().min(1, 'Informe a data'),
  observacao: z.string().optional(),
})

export type RegistrarAjusteMetaInput = z.infer<
  typeof registrarAjusteMetaSchema
>
