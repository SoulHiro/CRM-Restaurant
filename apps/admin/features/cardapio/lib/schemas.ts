import { z } from 'zod'

export const criarPratoSchema = z.object({
  nome: z.string().min(1, 'Informe o nome do prato'),
})

export const atualizarPratoSchema = z.object({
  pratoId: z.string().min(1),
  nome: z.string().min(1, 'Informe o nome do prato'),
  ativo: z.boolean(),
})

export const listarCardapioIntervaloSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
})

export type ListarCardapioIntervaloInput = z.infer<
  typeof listarCardapioIntervaloSchema
>

export const gerarPreviewCardapioSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  // Total gerado por dia (destaque + alternativas) — cobre a maior
  // necessidade entre as empresas; cada uma mostra só as N primeiras dela.
  itensPorDia: z.number().int().min(1).max(30),
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
  dias: z.array(cardapioDiaPropostoSchema).min(1),
})

export type ConfirmarCardapioMesInput = z.infer<
  typeof confirmarCardapioMesSchema
>
