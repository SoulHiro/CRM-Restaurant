'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

import { auth } from '@/lib/auth'
import { ActionError, adminActionClient } from '@/lib/safe-action'
import {
  atualizarUsuarioSchema,
  criarUsuarioSchema,
  redefinirSenhaSchema,
  removerUsuarioSchema,
} from './schemas'

function mensagemErro(err: unknown, padrao: string): string {
  return err instanceof Error ? err.message : padrao
}

export const criarUsuarioAction = adminActionClient
  .schema(criarUsuarioSchema)
  .action(async ({ parsedInput }) => {
    try {
      await auth.api.createUser({
        body: {
          name: parsedInput.name,
          email: parsedInput.email,
          password: parsedInput.password,
          role: parsedInput.role,
        },
        headers: await headers(),
      })
    } catch (err) {
      throw new ActionError(
        mensagemErro(err, 'Não foi possível criar o usuário.')
      )
    }

    revalidatePath('/usuarios')
  })

/**
 * Nome e cargo são dois endpoints diferentes no plugin admin
 * (`adminUpdateUser` e `setRole`) — chamados juntos aqui porque a tela edita
 * os dois campos numa única ação.
 */
export const atualizarUsuarioAction = adminActionClient
  .schema(atualizarUsuarioSchema)
  .action(async ({ parsedInput }) => {
    const hdrs = await headers()

    try {
      await auth.api.adminUpdateUser({
        body: { userId: parsedInput.userId, data: { name: parsedInput.name } },
        headers: hdrs,
      })
      await auth.api.setRole({
        body: { userId: parsedInput.userId, role: parsedInput.role },
        headers: hdrs,
      })
    } catch (err) {
      throw new ActionError(
        mensagemErro(err, 'Não foi possível atualizar o usuário.')
      )
    }

    revalidatePath('/usuarios')
  })

export const redefinirSenhaAction = adminActionClient
  .schema(redefinirSenhaSchema)
  .action(async ({ parsedInput }) => {
    try {
      await auth.api.setUserPassword({
        body: {
          userId: parsedInput.userId,
          newPassword: parsedInput.password,
        },
        headers: await headers(),
      })
    } catch (err) {
      throw new ActionError(
        mensagemErro(err, 'Não foi possível redefinir a senha.')
      )
    }
  })

export const removerUsuarioAction = adminActionClient
  .schema(removerUsuarioSchema)
  .action(async ({ parsedInput, ctx }) => {
    if (parsedInput.userId === ctx.user.id) {
      throw new ActionError('Você não pode remover a própria conta.')
    }

    try {
      await auth.api.removeUser({
        body: { userId: parsedInput.userId },
        headers: await headers(),
      })
    } catch (err) {
      throw new ActionError(
        mensagemErro(err, 'Não foi possível remover o usuário.')
      )
    }

    revalidatePath('/usuarios')
  })
