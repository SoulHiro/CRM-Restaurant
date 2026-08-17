'use server'

import { revalidatePath } from 'next/cache'

import { db } from '@/lib/db'
import { authActionClient } from '@/lib/safe-action'
import { configuracaoComanda } from '@repo/db'

import { getConfiguracaoComanda } from './queries'
import {
  obterConfiguracaoComandaSchema,
  salvarConfiguracaoComandaSchema,
} from './schemas'

export const obterConfiguracaoComandaAction = authActionClient
  .schema(obterConfiguracaoComandaSchema)
  .action(async () => {
    const configuracao = await getConfiguracaoComanda()
    return configuracao
  })

export const salvarConfiguracaoComandaAction = authActionClient
  .schema(salvarConfiguracaoComandaSchema)
  .action(async ({ parsedInput }) => {
    await db
      .insert(configuracaoComanda)
      .values({ id: 'default', campos: parsedInput.campos })
      .onConflictDoUpdate({
        target: configuracaoComanda.id,
        set: { campos: parsedInput.campos, updated_at: new Date() },
      })

    revalidatePath('/configuracoes')
    return { campos: parsedInput.campos }
  })
