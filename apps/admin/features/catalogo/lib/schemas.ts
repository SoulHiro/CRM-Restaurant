import { z } from 'zod'

import { UNIDADES } from '@/features/estoque/lib/types'
import { APLICA_A, DISPONIBILIDADE_STATUS, TIPOS_PRODUTO } from './types'

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

export const disponibilidadeJanelaSchema = z.object({
  diaSemana: z.coerce.number().int().min(0).max(6),
  horaInicio: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use o formato HH:mm'),
  horaFim: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use o formato HH:mm'),
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
    disponibilidadeStatus: z.enum(DISPONIBILIDADE_STATUS),
    apareceAlmoco: z.boolean(),
    apareceJanta: z.boolean(),
    janelas: z.array(disponibilidadeJanelaSchema),
    classificacaoIds: z.array(z.string()),
    adicionalIds: z.array(z.string()),
  })
  .refine((v) => v.disponivelDelivery || v.disponivelLocal, {
    message: 'Escolha pelo menos um canal — delivery ou local',
    path: ['disponivelDelivery'],
  })
  .refine(
    (v) => v.disponibilidadeStatus !== 'personalizado' || v.janelas.length > 0,
    {
      message: 'Adicione pelo menos uma janela de horário personalizado',
      path: ['janelas'],
    }
  )

export type CriarProdutoSchemaInput = z.infer<typeof criarProdutoSchema>

export const criarCategoriaProdutoSchema = z.object({
  nome: z.string().min(1, 'Informe o nome da categoria'),
})

export const criarClassificacaoSchema = z.object({
  nome: z.string().min(1, 'Informe o nome da classificação'),
  aplicaA: z.enum(APLICA_A),
})

export const criarAdicionalSchema = z.object({
  nome: z.string().min(1, 'Informe o nome do adicional'),
  preco: z.coerce.number().min(0),
})
