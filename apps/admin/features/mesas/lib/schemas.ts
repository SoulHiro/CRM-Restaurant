import { z } from 'zod'

import { FORMAS_PAGAMENTO } from './types'

export const abrirComandaSchema = z.object({
  numero: z.number().int().min(1),
  mesaLabel: z.string().trim().max(60).optional(),
})
export type AbrirComandaInput = z.infer<typeof abrirComandaSchema>

export const lancarItemSchema = z.object({
  comandaId: z.string().min(1),
  produtoId: z.string().min(1),
  produtoTamanhoId: z.string().min(1).optional(),
  quantidade: z.number().positive(),
  observacao: z.string().trim().max(280).optional(),
})
export type LancarItemInput = z.infer<typeof lancarItemSchema>

export const editarItemSchema = z.object({
  comandaItemId: z.string().min(1),
  quantidade: z.number().positive().optional(),
  observacao: z.string().trim().max(280).optional(),
})
export type EditarItemInput = z.infer<typeof editarItemSchema>

export const excluirItemSchema = z.object({
  comandaItemId: z.string().min(1),
})
export type ExcluirItemInput = z.infer<typeof excluirItemSchema>

export const enviarCozinhaSchema = z.object({
  comandaId: z.string().min(1),
})
export type EnviarCozinhaInput = z.infer<typeof enviarCozinhaSchema>

export const linhaPagamentoSchema = z.object({
  forma: z.enum(FORMAS_PAGAMENTO),
  valorCentavos: z.number().int().positive(),
})

export const registrarPagamentoSchema = z.object({
  comandaId: z.string().min(1),
  pagamentos: z.array(linhaPagamentoSchema).min(1),
})
export type RegistrarPagamentoInput = z.infer<typeof registrarPagamentoSchema>

export const cancelarComandaSchema = z.object({
  comandaId: z.string().min(1),
  motivo: z.string().trim().min(1).max(280),
})
export type CancelarComandaInput = z.infer<typeof cancelarComandaSchema>

export const marcarNotaPendenteSchema = z.object({
  comandaId: z.string().min(1),
  email: z.string().trim().email(),
})
export type MarcarNotaPendenteInput = z.infer<typeof marcarNotaPendenteSchema>
