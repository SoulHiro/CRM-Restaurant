import { z } from 'zod'

const turnoSchema = z.enum([
  'almoco',
  'jantar',
  '1_turno',
  '2_turno',
  '3_turno',
  'administrativo',
])

const respostaDiaSchema = z.object({
  data: z.string().min(1),
  // null = "não vou almoçar" nesse dia
  prato: z.string().nullable(),
  observacao: z.string().nullable(),
})

export const enviarRespostaSchema = z.object({
  empresaId: z.string().min(1),
  colaboradorId: z.string().min(1),
  turno: turnoSchema,
  // Único pra semana inteira — decidido junto com o usuário: mais rápido de
  // preencher, bate com o formulário antigo que isso substitui.
  tamanho: z.enum(['P', 'M', 'G']).nullable(),
  whatsapp: z.string().nullable(),
  respostas: z.array(respostaDiaSchema).min(1),
})

export type EnviarRespostaInput = z.infer<typeof enviarRespostaSchema>

export const buscarRespostasSchema = z.object({
  colaboradorId: z.string().min(1),
  turno: turnoSchema,
  from: z.string().min(1),
  to: z.string().min(1),
})

export const buscarCardapioSemanaSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  cardapioQtdAlternativas: z.number().int().min(0),
})
