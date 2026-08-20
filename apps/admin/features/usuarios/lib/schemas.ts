import { z } from 'zod'

import { roles } from '@repo/auth'

export const criarUsuarioSchema = z.object({
  name: z.string().min(1, 'Informe o nome'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  role: z.enum(roles),
})

export type CriarUsuarioInput = z.infer<typeof criarUsuarioSchema>

export const atualizarUsuarioSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1, 'Informe o nome'),
  role: z.enum(roles),
})

export type AtualizarUsuarioInput = z.infer<typeof atualizarUsuarioSchema>

export const redefinirSenhaSchema = z.object({
  userId: z.string().min(1),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
})

export type RedefinirSenhaInput = z.infer<typeof redefinirSenhaSchema>

export const removerUsuarioSchema = z.object({
  userId: z.string().min(1),
})

export type RemoverUsuarioInput = z.infer<typeof removerUsuarioSchema>
