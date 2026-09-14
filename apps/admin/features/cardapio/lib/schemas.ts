import { z } from 'zod'

import { CATEGORIAS_PRATO } from './categoria-prato'

const categoriaPratoSchema = z.enum(CATEGORIAS_PRATO)

export const criarPratoSchema = z.object({
  nome: z.string().min(1, 'Informe o nome do prato'),
  categoria: categoriaPratoSchema,
})

export const atualizarPratoSchema = z.object({
  pratoId: z.string().min(1),
  nome: z.string().min(1, 'Informe o nome do prato'),
  ativo: z.boolean(),
  categoria: categoriaPratoSchema,
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

export const listarExtrasEmpresaSchema = z.object({
  empresaId: z.string().min(1),
  from: z.string().min(1),
  to: z.string().min(1),
})

export type ListarExtrasEmpresaInput = z.infer<
  typeof listarExtrasEmpresaSchema
>

export const adicionarExtraEmpresaSchema = z.object({
  empresaId: z.string().min(1),
  data: z.string().min(1),
  pratoCatalogoId: z.string().min(1),
})

export type AdicionarExtraEmpresaInput = z.infer<
  typeof adicionarExtraEmpresaSchema
>

export const removerExtraEmpresaSchema = z.object({
  extraId: z.string().min(1),
})

export type RemoverExtraEmpresaInput = z.infer<
  typeof removerExtraEmpresaSchema
>

export const adicionarItemDiaSchema = z.object({
  data: z.string().min(1),
  pratoCatalogoId: z.string().min(1),
})

export type AdicionarItemDiaInput = z.infer<typeof adicionarItemDiaSchema>

export const removerItemDiaSchema = z.object({
  itemId: z.string().min(1),
})

export type RemoverItemDiaInput = z.infer<typeof removerItemDiaSchema>

export const reordenarAlternativasSchema = z.object({
  diaId: z.string().min(1),
  itemIds: z.array(z.string().min(1)),
})

export type ReordenarAlternativasInput = z.infer<
  typeof reordenarAlternativasSchema
>

export const promoverDestaqueSchema = z.object({
  diaId: z.string().min(1),
  itemId: z.string().min(1),
})

export type PromoverDestaqueInput = z.infer<typeof promoverDestaqueSchema>

export const removerDestaqueSchema = z.object({
  diaId: z.string().min(1),
  itemId: z.string().min(1),
})

export type RemoverDestaqueInput = z.infer<typeof removerDestaqueSchema>

export const marcarEspecialSchema = z.object({
  itemId: z.string().min(1),
  especial: z.boolean(),
})

export type MarcarEspecialInput = z.infer<typeof marcarEspecialSchema>

export const fixarItemSchema = z.object({
  itemId: z.string().min(1),
})

export type FixarItemInput = z.infer<typeof fixarItemSchema>

export const desfixarItemSchema = z.object({
  itemId: z.string().min(1),
})

export type DesfixarItemInput = z.infer<typeof desfixarItemSchema>

export const confirmarCardapioMesSchema = z.object({
  dias: z.array(cardapioDiaPropostoSchema).min(1),
})

export type ConfirmarCardapioMesInput = z.infer<
  typeof confirmarCardapioMesSchema
>
