import { z } from 'zod'

import { PERDA_MOTIVOS, UNIDADES } from './types'

const quantidade = z.coerce
  .number({ invalid_type_error: 'Informe um número' })
  .min(0, 'Não pode ser negativo')
  .max(9_999_999, 'Valor alto demais')

const quantidadePositiva = quantidade.refine(
  (value) => value > 0,
  'Informe uma quantidade maior que zero'
)

const dataOpcional = z
  .string()
  .optional()
  .or(z.literal(''))
  .transform((value) => (value ? value : undefined))

// 0 = "não informado" tanto quanto ausente — tamanho da embalagem e preço
// novo são opcionais, e o input HTML de number manda '' quando vazio, então
// quantidade (que exige number) não serve para eles.
const numeroOpcional = z.coerce
  .number()
  .min(0, 'Não pode ser negativo')
  .max(9_999_999, 'Valor alto demais')
  .optional()

export const createEstoqueItemSchema = z.object({
  nome: z.string().min(1, 'Informe o nome do item'),
  unidade: z.enum(UNIDADES),
  quantidadeAtual: quantidade,
  tamanhoEmbalagem: numeroOpcional,
  pontoReposicao: quantidade,
  validade: dataOpcional,
})

export type CreateEstoqueItemInput = z.infer<typeof createEstoqueItemSchema>

export const createEstoqueItemDefaultValues: CreateEstoqueItemInput = {
  nome: '',
  unidade: 'un',
  quantidadeAtual: 0,
  tamanhoEmbalagem: undefined,
  pontoReposicao: 0,
  validade: undefined,
}

// Editar cobre o cadastro do item (nome/unidade/embalagem/reposição/validade)
// + um preço novo opcional (vira linha nova no histórico, nunca edita a
// anterior) — tudo coisa de "corrigir o que já era". Quantidade em estoque
// fica fora de propósito: mexe no livro-razão, é a correção mais frequente
// do módulo, e merece o próprio atalho rápido (Ajustar quantidade) em vez de
// ficar no meio de um formulário maior. Perda e desativação continuam à
// parte por serem eventos, não edição de cadastro.
export const updateEstoqueItemSchema = z.object({
  id: z.string().min(1),
  nome: z.string().min(1, 'Informe o nome do item'),
  unidade: z.enum(UNIDADES),
  tamanhoEmbalagem: numeroOpcional,
  pontoReposicao: quantidade,
  validade: dataOpcional,
  // '' = "nenhum": o Select do shadcn não aceita item com valor vazio, então
  // a ausência vem como string vazia e vira null na action.
  fornecedorPadraoId: z.string().optional(),
  novoPreco: numeroOpcional,
  precoDataVigencia: z.string().optional(),
})

export type UpdateEstoqueItemInput = z.infer<typeof updateEstoqueItemSchema>

export const ajustarQuantidadeSchema = z.object({
  estoqueItemId: z.string().min(1),
  quantidadeCorreta: quantidade,
  observacao: z.string().optional(),
})

export type AjustarQuantidadeInput = z.infer<typeof ajustarQuantidadeSchema>

export function ajustarQuantidadeDefaultValues(
  estoqueItemId: string,
  quantidadeAtual: number
): AjustarQuantidadeInput {
  return { estoqueItemId, quantidadeCorreta: quantidadeAtual, observacao: '' }
}

export const toggleEstoqueItemAtivoSchema = z.object({
  id: z.string().min(1),
  ativo: z.boolean(),
})

export type ToggleEstoqueItemAtivoInput = z.infer<
  typeof toggleEstoqueItemAtivoSchema
>

export const registrarPerdaSchema = z.object({
  estoqueItemId: z.string().min(1, 'Selecione o item'),
  quantidade: quantidadePositiva,
  motivo: z.enum(PERDA_MOTIVOS),
  data: z.string().min(1, 'Informe a data'),
  observacao: z.string().optional(),
})

export type RegistrarPerdaInput = z.infer<typeof registrarPerdaSchema>

export function registrarPerdaDefaultValues(
  estoqueItemId: string,
  hoje: string
): RegistrarPerdaInput {
  return {
    estoqueItemId,
    quantidade: 0,
    motivo: 'quebra',
    data: hoje,
    observacao: '',
  }
}

export const iniciarInventarioSchema = z.object({
  data: z.string().min(1, 'Informe a data'),
  observacao: z.string().optional(),
})

export type IniciarInventarioInput = z.infer<typeof iniciarInventarioSchema>

export const salvarContagemSchema = z.object({
  linhaId: z.string().min(1),
  inventarioId: z.string().min(1),
  // string vazia = contagem apagada, volta a "não contado"
  quantidadeContada: z
    .union([z.coerce.number().min(0, 'Não pode ser negativo'), z.literal('')])
    .transform((value) => (value === '' ? null : value)),
})

export type SalvarContagemInput = z.infer<typeof salvarContagemSchema>

export const finalizarInventarioSchema = z.object({
  id: z.string().min(1),
})

export type FinalizarInventarioInput = z.infer<
  typeof finalizarInventarioSchema
>
