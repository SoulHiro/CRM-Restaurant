import { z } from 'zod'

import { UNIDADES } from '@/features/estoque/lib/types'
import { TIPOS_PRODUTO } from './types'

export const fichaTecnicaOverrideTamanhoSchema = z.object({
  tamanhoKey: z.string().min(1),
  estoqueItemId: z.string().nullable(),
  quantidade: z.coerce.number().min(0),
})

export const fichaTecnicaItemSchema = z.object({
  estoqueItemId: z.string().min(1),
  nome: z.string().min(1),
  unidade: z.enum(UNIDADES),
  quantidade: z.coerce
    .number()
    .positive('Informe uma quantidade maior que zero'),
  custoUnitario: z.coerce.number().min(0),
  tipoEscala: z.enum(['proporcional', 'fixo']),
  overridesPorTamanho: z.array(fichaTecnicaOverrideTamanhoSchema),
})

export const tamanhoSchema = z.object({
  key: z.string().min(1),
  nome: z.string().min(1, 'Informe o nome do tamanho'),
  pesoGramas: z.coerce.number().positive('Informe o peso em gramas'),
  precoVenda: z.coerce.number().min(0, 'Informe o preço de venda'),
  ehBase: z.boolean(),
})

const produtoCamposBase = {
  nome: z.string().min(1, 'Informe o nome do produto'),
  categoriaId: z.string().nullable(),
  tipo: z.enum(TIPOS_PRODUTO),
  fotoUrl: z.string().optional(),
  fichaTecnica: z.array(fichaTecnicaItemSchema),
  tempoMedioPreparoMinutos: z.coerce.number().min(0).max(9999),
  temTamanhos: z.boolean(),
  tamanhos: z.array(tamanhoSchema),
  precoVenda: z.coerce.number().min(0, 'Informe o preço de venda'),
  pausadoHoje: z.boolean(),
}

type ProdutoCampos = z.infer<z.ZodObject<typeof produtoCamposBase>>

function tamanhosMinimos(v: ProdutoCampos) {
  return !v.temTamanhos || v.tamanhos.length >= 2
}
function tamanhosTemUmaBase(v: ProdutoCampos) {
  return !v.temTamanhos || v.tamanhos.filter((t) => t.ehBase).length === 1
}

export const criarProdutoSchema = z
  .object(produtoCamposBase)
  .refine(tamanhosMinimos, {
    message: 'Cadastre pelo menos dois tamanhos (ex: P e G)',
    path: ['tamanhos'],
  })
  .refine(tamanhosTemUmaBase, {
    message: 'Marque exatamente um tamanho como base da ficha técnica',
    path: ['tamanhos'],
  })

export type CriarProdutoSchemaInput = z.infer<typeof criarProdutoSchema>

export const editarProdutoSchema = z
  .object({ ...produtoCamposBase, id: z.string().min(1) })
  .refine(tamanhosMinimos, {
    message: 'Cadastre pelo menos dois tamanhos (ex: P e G)',
    path: ['tamanhos'],
  })
  .refine(tamanhosTemUmaBase, {
    message: 'Marque exatamente um tamanho como base da ficha técnica',
    path: ['tamanhos'],
  })

export type EditarProdutoSchemaInput = z.infer<typeof editarProdutoSchema>

export const duplicarProdutoSchema = z.object({
  produtoId: z.string().min(1),
})

export type DuplicarProdutoInput = z.infer<typeof duplicarProdutoSchema>

export const criarCategoriaProdutoSchema = z.object({
  nome: z.string().min(1, 'Informe o nome da categoria'),
})
