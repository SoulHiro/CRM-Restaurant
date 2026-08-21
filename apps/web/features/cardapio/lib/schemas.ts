import { z } from 'zod'

const respostaDiaSchema = z.object({
  data: z.string().min(1),
  // null = "não vou almoçar" nesse dia
  prato: z.string().nullable(),
  tamanho: z.enum(['P', 'M', 'G']).nullable(),
})

export const enviarRespostaSchema = z.object({
  empresaId: z.string().min(1),
  colaboradorId: z.string().min(1),
  respostas: z.array(respostaDiaSchema).min(1),
})

export type EnviarRespostaInput = z.infer<typeof enviarRespostaSchema>

export const buscarRespostasSchema = z.object({
  colaboradorId: z.string().min(1),
  from: z.string().min(1),
  to: z.string().min(1),
})
