import { z } from 'zod'

import { DESPESA_SUBTIPOS } from '@/features/financeiro/lib/types'

import { AVALIACAO_TIPOS } from './types'

const dinheiro = z.coerce
  .number({ invalid_type_error: 'Informe um valor' })
  .min(0, 'Não pode ser negativo')
  .max(99_999_999, 'Valor alto demais')

const quantidade = z.coerce
  .number({ invalid_type_error: 'Informe a quantidade' })
  .positive('Informe uma quantidade maior que zero')
  .max(9_999_999, 'Quantidade alta demais')

export const idSchema = z.object({ id: z.string().min(1) })
export type IdInput = z.infer<typeof idSchema>

export const compraLinhaSchema = z.object({
  estoqueItemId: z.string().min(1, 'Escolha o item'),
  quantidade,
  valorUnitario: dinheiro.refine((v) => v > 0, 'Informe o valor unitário'),
})

export type CompraLinhaInput = z.infer<typeof compraLinhaSchema>

export const createCompraSchema = z.object({
  fornecedorId: z.string().min(1, 'Escolha o fornecedor'),
  numeroNotaFiscal: z.string().optional(),
  categoriaDespesa: z.enum(DESPESA_SUBTIPOS),
  dataPedido: z.string().min(1, 'Informe a data do pedido'),
  dataVencimento: z.string().min(1, 'Informe o vencimento do pagamento'),
  formaPagamento: z.string().optional(),
  observacao: z.string().optional(),
  linhas: z
    .array(compraLinhaSchema)
    .min(1, 'Adicione pelo menos um item')
    // O banco tem unique(compra_id, estoque_item_id) — barrar aqui devolve uma
    // mensagem útil em vez de erro cru de constraint.
    .refine(
      (linhas) =>
        new Set(linhas.map((l) => l.estoqueItemId)).size === linhas.length,
      'O mesmo item aparece duas vezes — some as quantidades numa linha só'
    ),
})

export type CreateCompraInput = z.infer<typeof createCompraSchema>

export function createCompraDefaultValues(hoje: string): CreateCompraInput {
  return {
    fornecedorId: '',
    numeroNotaFiscal: '',
    categoriaDespesa: 'insumo',
    dataPedido: hoje,
    dataVencimento: hoje,
    formaPagamento: '',
    observacao: '',
    linhas: [],
  }
}

export const receberCompraSchema = z.object({
  id: z.string().min(1),
  dataRecebimento: z.string().min(1, 'Informe a data do recebimento'),
})
export type ReceberCompraInput = z.infer<typeof receberCompraSchema>

export const upsertFornecedorSchema = z.object({
  id: z.string().optional(),
  nome: z.string().min(1, 'Informe o nome do fornecedor'),
  contato: z.string().optional(),
  prazoEntregaDias: z.coerce
    .number()
    .int('Use dias inteiros')
    .min(0, 'Não pode ser negativo')
    .max(365, 'Prazo longo demais')
    .optional(),
  prazoPagamento: z.string().optional(),
})

export type UpsertFornecedorInput = z.infer<typeof upsertFornecedorSchema>

export function upsertFornecedorDefaultValues(): UpsertFornecedorInput {
  return {
    nome: '',
    contato: '',
    prazoEntregaDias: undefined,
    prazoPagamento: '',
  }
}

export const upsertFornecedorItemSchema = z.object({
  id: z.string().optional(),
  fornecedorId: z.string().min(1),
  estoqueItemId: z.string().min(1, 'Escolha o item'),
  preco: dinheiro.refine((v) => v > 0, 'Informe o preço'),
  prazoEntregaDias: z.coerce
    .number()
    .int('Use dias inteiros')
    .min(0, 'Não pode ser negativo')
    .max(365, 'Prazo longo demais')
    .optional(),
  observacao: z.string().optional(),
})

export type UpsertFornecedorItemInput = z.infer<
  typeof upsertFornecedorItemSchema
>

export const registrarAvaliacaoSchema = z.object({
  fornecedorId: z.string().min(1),
  data: z.string().min(1, 'Informe a data'),
  nota: z.coerce
    .number()
    .int()
    .min(1, 'A nota vai de 1 a 5')
    .max(5, 'A nota vai de 1 a 5'),
  tipo: z.enum(AVALIACAO_TIPOS),
  observacao: z.string().optional(),
})

export type RegistrarAvaliacaoInput = z.infer<typeof registrarAvaliacaoSchema>

export function registrarAvaliacaoDefaultValues(
  fornecedorId: string,
  hoje: string
): RegistrarAvaliacaoInput {
  return {
    fornecedorId,
    data: hoje,
    nota: 5,
    tipo: 'outro',
    observacao: '',
  }
}
