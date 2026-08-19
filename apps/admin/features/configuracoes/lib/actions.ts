'use server'

import { revalidatePath, updateTag } from 'next/cache'

import { db } from '@/lib/db'
import { authActionClient } from '@/lib/safe-action'
import { configuracaoComanda, configuracaoResumoDia, impressora } from '@repo/db'

import { TAG_CONFIGURACAO_IMPRESSAO } from '@/features/empresas/lib/cache-tags'
import {
  getConfiguracaoComanda,
  getConfiguracaoLayoutResumo,
  getConfiguracaoResumoDia,
  listarImpressorasComanda,
} from './queries'
import {
  criarImpressoraSchema,
  listarImpressorasComandaSchema,
  obterConfiguracaoComandaSchema,
  obterConfiguracaoLayoutResumoSchema,
  obterConfiguracaoResumoDiaSchema,
  salvarConfiguracaoComandaSchema,
  salvarConfiguracaoResumoDiaSchema,
  salvarLayoutResumoSchema,
} from './schemas'

export const obterConfiguracaoComandaAction = authActionClient
  .schema(obterConfiguracaoComandaSchema)
  .action(async () => {
    const configuracao = await getConfiguracaoComanda()
    return configuracao
  })

export const listarImpressorasComandaAction = authActionClient
  .schema(listarImpressorasComandaSchema)
  .action(async () => {
    const impressoras = await listarImpressorasComanda()
    return { impressoras }
  })

export const criarImpressoraAction = authActionClient
  .schema(criarImpressoraSchema)
  .action(async ({ parsedInput }) => {
    const [criada] = await db
      .insert(impressora)
      .values({
        nome: parsedInput.nome.trim(),
        tipo: 'comanda',
        identificador_qz: parsedInput.identificadorQz,
        ativo: true,
      })
      .returning({ id: impressora.id, nome: impressora.nome })

    revalidatePath('/configuracoes/impressao')
    updateTag(TAG_CONFIGURACAO_IMPRESSAO)
    return criada
  })

export const salvarConfiguracaoComandaAction = authActionClient
  .schema(salvarConfiguracaoComandaSchema)
  .action(async ({ parsedInput }) => {
    await db
      .insert(configuracaoComanda)
      .values({
        id: 'default',
        campos: parsedInput.campos,
        impressora_id: parsedInput.impressoraId,
      })
      .onConflictDoUpdate({
        target: configuracaoComanda.id,
        set: {
          campos: parsedInput.campos,
          impressora_id: parsedInput.impressoraId,
          updated_at: new Date(),
        },
      })

    revalidatePath('/configuracoes/impressao')
    updateTag(TAG_CONFIGURACAO_IMPRESSAO)
    return { campos: parsedInput.campos, impressoraId: parsedInput.impressoraId }
  })

export const obterConfiguracaoResumoDiaAction = authActionClient
  .schema(obterConfiguracaoResumoDiaSchema)
  .action(async () => {
    return getConfiguracaoResumoDia()
  })

export const salvarConfiguracaoResumoDiaAction = authActionClient
  .schema(salvarConfiguracaoResumoDiaSchema)
  .action(async ({ parsedInput }) => {
    await db
      .insert(configuracaoResumoDia)
      .values({
        id: 'default',
        logo_url: parsedInput.logoUrl?.trim() || null,
        cor_marca: parsedInput.corMarca?.trim() || null,
      })
      .onConflictDoUpdate({
        target: configuracaoResumoDia.id,
        set: {
          logo_url: parsedInput.logoUrl?.trim() || null,
          cor_marca: parsedInput.corMarca?.trim() || null,
          updated_at: new Date(),
        },
      })

    revalidatePath('/configuracoes')
    return parsedInput
  })

export const obterConfiguracaoLayoutResumoAction = authActionClient
  .schema(obterConfiguracaoLayoutResumoSchema)
  .action(async () => {
    return getConfiguracaoLayoutResumo()
  })

export const salvarLayoutResumoAction = authActionClient
  .schema(salvarLayoutResumoSchema)
  .action(async ({ parsedInput }) => {
    await db
      .insert(configuracaoResumoDia)
      .values({
        id: 'default',
        layout_campos: parsedInput.campos,
      })
      .onConflictDoUpdate({
        target: configuracaoResumoDia.id,
        set: {
          layout_campos: parsedInput.campos,
          updated_at: new Date(),
        },
      })

    revalidatePath('/configuracoes/impressao')
    return { campos: parsedInput.campos }
  })
