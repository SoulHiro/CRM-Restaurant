import { z } from 'zod'

export const listarCatalogoSchema = z.object({
  empresaId: z.string().min(1),
})

export const criarPratoSchema = z.object({
  empresaId: z.string().min(1),
  nome: z.string().min(1, 'Informe o nome do prato'),
})

export const atualizarPratoSchema = z.object({
  pratoId: z.string().min(1),
  nome: z.string().min(1, 'Informe o nome do prato'),
  ativo: z.boolean(),
})

export const listarCardapioIntervaloSchema = z.object({
  empresaId: z.string().min(1),
  from: z.string().min(1),
  to: z.string().min(1),
})

export type ListarCardapioIntervaloInput = z.infer<
  typeof listarCardapioIntervaloSchema
>

export const gerarPreviewCardapioSchema = z.object({
  empresaId: z.string().min(1),
  from: z.string().min(1),
  to: z.string().min(1),
  itensPorDia: z.number().int().min(1).max(20),
  pratoFeijoadaId: z.string().min(1).nullable(),
})

export type GerarPreviewCardapioInput = z.infer<
  typeof gerarPreviewCardapioSchema
>

const cardapioDiaPropostoSchema = z.object({
  data: z.string().min(1),
  destaqueId: z.string().min(1),
  alternativaIds: z.array(z.string().min(1)),
})

export const confirmarCardapioMesSchema = z.object({
  empresaId: z.string().min(1),
  dias: z.array(cardapioDiaPropostoSchema).min(1),
})

export type ConfirmarCardapioMesInput = z.infer<
  typeof confirmarCardapioMesSchema
>
