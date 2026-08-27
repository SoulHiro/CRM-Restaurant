import { z } from 'zod'

export const registrarConsumoSchema = z.object({
  funcionarioId: z.string().min(1),
  produtoId: z.string().min(1),
  quantidade: z.coerce.number().int().positive(),
})

export const quitarConsumoSchema = z.object({
  funcionarioId: z.string().min(1),
})
