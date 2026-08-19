import { z } from 'zod'

import { TODOS_CAMPOS_COMANDA, TODOS_CAMPOS_RESUMO } from './types'

export const obterConfiguracaoComandaSchema = z.object({})

export const listarImpressorasComandaSchema = z.object({})

export const listarImpressorasPesagemSchema = z.object({})

export const criarImpressoraSchema = z.object({
  nome: z.string().min(1, 'Informe um nome pra identificar a impressora'),
  identificadorQz: z
    .string()
    .min(1, 'Escolha a impressora detectada pelo QZ Tray'),
  tipo: z.enum(['comanda', 'pesagem']).default('comanda'),
})

export type CriarImpressoraInput = z.infer<typeof criarImpressoraSchema>

export const obterConfiguracaoPesagemSchema = z.object({})

export const salvarConfiguracaoPesagemSchema = z.object({
  impressoraId: z.string().nullable(),
})

export type SalvarConfiguracaoPesagemInput = z.infer<
  typeof salvarConfiguracaoPesagemSchema
>

export const salvarConfiguracaoComandaSchema = z.object({
  campos: z
    .array(z.enum(TODOS_CAMPOS_COMANDA as [string, ...string[]]))
    .max(TODOS_CAMPOS_COMANDA.length),
  impressoraId: z.string().nullable(),
})

export type SalvarConfiguracaoComandaInput = z.infer<
  typeof salvarConfiguracaoComandaSchema
>

export const obterConfiguracaoResumoDiaSchema = z.object({})

export const salvarConfiguracaoResumoDiaSchema = z.object({
  logoUrl: z.string().optional(),
  corMarca: z.string().optional(),
})

export type SalvarConfiguracaoResumoDiaInput = z.infer<
  typeof salvarConfiguracaoResumoDiaSchema
>

export const obterConfiguracaoLayoutResumoSchema = z.object({})

export const salvarLayoutResumoSchema = z.object({
  campos: z
    .array(z.enum(TODOS_CAMPOS_RESUMO as [string, ...string[]]))
    .max(TODOS_CAMPOS_RESUMO.length),
})

export type SalvarLayoutResumoInput = z.infer<typeof salvarLayoutResumoSchema>
