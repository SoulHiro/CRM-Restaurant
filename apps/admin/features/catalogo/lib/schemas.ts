import { z } from 'zod'

import { UNIDADES } from '@/features/estoque/lib/types'
import { TIPOS_PRODUTO } from './types'

const descontoValorOpcional = z.coerce
  .number()
  .min(0, 'Não pode ser negativo')
  .nullable()

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
  descricao: z.string().optional(),
  fotoUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  fichaTecnica: z.array(fichaTecnicaItemSchema),
  tempoMedioPreparoMinutos: z.coerce.number().min(0).max(9999),
  temTamanhos: z.boolean(),
  tamanhos: z.array(tamanhoSchema),
  precoVenda: z.coerce.number().min(0, 'Informe o preço de venda'),
  descontoTipo: z.enum(['percentual', 'valorFixo']),
  descontoValor: descontoValorOpcional,
  disponivelDelivery: z.boolean(),
  disponivelLocal: z.boolean(),
  pausadoHoje: z.boolean(),
  apareceAlmoco: z.boolean(),
  apareceJanta: z.boolean(),
  diasSemana: z.array(z.number().int().min(0).max(6)),
  classificacoes: z.array(z.string()),
  grupoAdicionalIds: z.array(z.string()),
}

type ProdutoCampos = z.infer<z.ZodObject<typeof produtoCamposBase>>

function disponibilidadeValida(v: ProdutoCampos) {
  return v.disponivelDelivery || v.disponivelLocal
}
function turnoValido(v: ProdutoCampos) {
  return v.apareceAlmoco || v.apareceJanta
}
function tamanhosMinimos(v: ProdutoCampos) {
  return !v.temTamanhos || v.tamanhos.length >= 2
}
function tamanhosTemUmaBase(v: ProdutoCampos) {
  return !v.temTamanhos || v.tamanhos.filter((t) => t.ehBase).length === 1
}
function descontoPercentualValido(v: ProdutoCampos) {
  return (
    v.descontoTipo !== 'percentual' ||
    v.descontoValor == null ||
    v.descontoValor <= 100
  )
}

export const criarProdutoSchema = z
  .object(produtoCamposBase)
  .refine(disponibilidadeValida, {
    message: 'Escolha pelo menos um canal — delivery ou local',
    path: ['disponivelDelivery'],
  })
  .refine(turnoValido, {
    message: 'Escolha pelo menos um turno — almoço ou janta',
    path: ['apareceAlmoco'],
  })
  .refine(tamanhosMinimos, {
    message: 'Cadastre pelo menos dois tamanhos (ex: P e G)',
    path: ['tamanhos'],
  })
  .refine(tamanhosTemUmaBase, {
    message: 'Marque exatamente um tamanho como base da ficha técnica',
    path: ['tamanhos'],
  })
  .refine(descontoPercentualValido, {
    message: 'Desconto percentual acima de 100% não faz sentido',
    path: ['descontoValor'],
  })

export type CriarProdutoSchemaInput = z.infer<typeof criarProdutoSchema>

export const editarProdutoSchema = z
  .object({ ...produtoCamposBase, id: z.string().min(1) })
  .refine(disponibilidadeValida, {
    message: 'Escolha pelo menos um canal — delivery ou local',
    path: ['disponivelDelivery'],
  })
  .refine(turnoValido, {
    message: 'Escolha pelo menos um turno — almoço ou janta',
    path: ['apareceAlmoco'],
  })
  .refine(tamanhosMinimos, {
    message: 'Cadastre pelo menos dois tamanhos (ex: P e G)',
    path: ['tamanhos'],
  })
  .refine(tamanhosTemUmaBase, {
    message: 'Marque exatamente um tamanho como base da ficha técnica',
    path: ['tamanhos'],
  })
  .refine(descontoPercentualValido, {
    message: 'Desconto percentual acima de 100% não faz sentido',
    path: ['descontoValor'],
  })

export type EditarProdutoSchemaInput = z.infer<typeof editarProdutoSchema>

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
