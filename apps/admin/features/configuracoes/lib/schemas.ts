import { z } from 'zod'

import { TODOS_CAMPOS_COMANDA } from './types'

export const obterConfiguracaoComandaSchema = z.object({})

export const salvarConfiguracaoComandaSchema = z.object({
  campos: z
    .array(z.enum(TODOS_CAMPOS_COMANDA as [string, ...string[]]))
    .max(TODOS_CAMPOS_COMANDA.length),
})

export type SalvarConfiguracaoComandaInput = z.infer<
  typeof salvarConfiguracaoComandaSchema
>
