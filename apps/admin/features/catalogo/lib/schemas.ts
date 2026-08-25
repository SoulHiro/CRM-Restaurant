import { z } from 'zod'

import { UNIDADES } from '@/features/estoque/lib/types'
import { TIPOS_PRODUTO } from './types'

const percentualOpcional = z.coerce
  .number()
  .min(0, 'Não pode ser negativo')
  .max(100, 'Desconto acima de 100% não faz sentido')
  .nullable()

export const fichaTecnicaItemSchema = z.object({
  estoqueItemId: z.string().min(1),
  nome: z.string().min(1),
  unidade: z.enum(UNIDADES),
  quantidade: z.coerce
    .number()
    .positive('Informe uma quantidade maior que zero'),
  custoUnitario: z.coerce.number().min(0),
})

export const criarProdutoSchema = z
  .object({
    nome: z.string().min(1, 'Informe o nome do produto'),
    categoriaId: z.string().nullable(),
    tipo: z.enum(TIPOS_PRODUTO),
    descricao: z.string().optional(),
    fotoUrl: z.string().optional(),
    videoUrl: z.string().optional(),
    fichaTecnica: z.array(fichaTecnicaItemSchema),
    tempoMedioPreparoMinutos: z.coerce.number().min(0).max(9999),
    precoVenda: z.coerce.number().min(0, 'Informe o preço de venda'),
    descontoPercentual: percentualOpcional,
    disponivelDelivery: z.boolean(),
    disponivelLocal: z.boolean(),
    pausadoHoje: z.boolean(),
    apareceAlmoco: z.boolean(),
    apareceJanta: z.boolean(),
    diasSemana: z.array(z.number().int().min(0).max(6)),
    classificacoes: z.array(z.string()),
    grupoAdicionalIds: z.array(z.string()),
  })
  .refine((v) => v.disponivelDelivery || v.disponivelLocal, {
    message: 'Escolha pelo menos um canal — delivery ou local',
    path: ['disponivelDelivery'],
  })
  .refine((v) => v.apareceAlmoco || v.apareceJanta, {
    message: 'Escolha pelo menos um turno — almoço ou janta',
    path: ['apareceAlmoco'],
  })

export type CriarProdutoSchemaInput = z.infer<typeof criarProdutoSchema>

export const criarCategoriaProdutoSchema = z.object({
  nome: z.string().min(1, 'Informe o nome da categoria'),
})

export const criarGrupoAdicionalSchema = z.object({
  nome: z.string().min(1, 'Informe o nome do grupo'),
  disponivelAlmoco: z.boolean(),
  disponivelJanta: z.boolean(),
})

export const criarAdicionalItemSchema = z
  .object({
    grupoId: z.string().min(1),
    nome: z.string().min(1, 'Informe o nome do item'),
    preco: z.coerce.number().min(0),
    fotoUrl: z.string().optional(),
    quantidadeMinima: z.coerce.number().int().min(0),
    quantidadeMaxima: z.coerce.number().int().min(1),
  })
  .refine((v) => v.quantidadeMaxima >= v.quantidadeMinima, {
    message: 'A quantidade máxima não pode ser menor que a mínima',
    path: ['quantidadeMaxima'],
  })
