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

const horaHHmm = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use o formato HH:mm')

export const obterConfiguracaoHorarioFuncionamentoSchema = z.object({})

export const salvarConfiguracaoHorarioFuncionamentoSchema = z.object({
  almocoInicio: horaHHmm,
  almocoFim: horaHHmm,
  jantaInicio: horaHHmm,
  jantaFim: horaHHmm,
  deliveryAbre: horaHHmm,
  deliveryFecha: horaHHmm,
  localAbre: horaHHmm,
  localFecha: horaHHmm,
})

export type SalvarConfiguracaoHorarioFuncionamentoInput = z.infer<
  typeof salvarConfiguracaoHorarioFuncionamentoSchema
>

const percentual = z.coerce
  .number({ invalid_type_error: 'Informe um número' })
  .min(0, 'Não pode ser negativo')
  .max(9999, 'Valor alto demais')

export const obterConfiguracaoPrecificacaoSchema = z.object({})

export const salvarConfiguracaoPrecificacaoSchema = z
  .object({
    custoOperacionalPorMinuto: percentual,
    limiarAmareloPct: percentual,
    limiarVerdePct: percentual,
    limiarAzulPct: percentual,
    limiarRoxoPct: percentual,
  })
  .refine(
    (v) =>
      v.limiarAmareloPct <= v.limiarVerdePct &&
      v.limiarVerdePct <= v.limiarAzulPct &&
      v.limiarAzulPct <= v.limiarRoxoPct,
    {
      message: 'Os limiares precisam estar em ordem crescente',
      path: ['limiarVerdePct'],
    }
  )

export type SalvarConfiguracaoPrecificacaoInput = z.infer<
  typeof salvarConfiguracaoPrecificacaoSchema
>
