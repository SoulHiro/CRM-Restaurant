import { z } from 'zod'

import { TODOS_CAMPOS_COMANDA } from './types'

export const obterConfiguracaoComandaSchema = z.object({})

export const listarImpressorasComandaSchema = z.object({})

export const criarImpressoraSchema = z.object({
  nome: z.string().min(1, 'Informe um nome pra identificar a impressora'),
  identificadorQz: z
    .string()
    .min(1, 'Escolha a impressora detectada pelo QZ Tray'),
})

export type CriarImpressoraInput = z.infer<typeof criarImpressoraSchema>

export const salvarConfiguracaoComandaSchema = z.object({
  campos: z
    .array(z.enum(TODOS_CAMPOS_COMANDA as [string, ...string[]]))
    .max(TODOS_CAMPOS_COMANDA.length),
  impressoraId: z.string().nullable(),
})

export type SalvarConfiguracaoComandaInput = z.infer<
  typeof salvarConfiguracaoComandaSchema
>
