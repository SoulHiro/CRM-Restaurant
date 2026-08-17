'use server'

import { revalidatePath } from 'next/cache'

import { db } from '@/lib/db'
import { authActionClient } from '@/lib/safe-action'
import { toMoneyString } from '@/lib/numeric'
import { configuracaoComanda, configuracaoResumoDia, impressora } from '@repo/db'

import {
  getConfiguracaoComanda,
  getConfiguracaoResumoDia,
  listarImpressorasComanda,
} from './queries'
import {
  criarImpressoraSchema,
  listarImpressorasComandaSchema,
  obterConfiguracaoComandaSchema,
  obterConfiguracaoResumoDiaSchema,
  salvarConfiguracaoComandaSchema,
  salvarConfiguracaoResumoDiaSchema,
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
        cnpj: parsedInput.cnpj?.trim() || null,
        nome_estabelecimento: parsedInput.nomeEstabelecimento?.trim() || null,
        preco_cafe: toMoneyString(parsedInput.precoCafe),
        preco_suco: toMoneyString(parsedInput.precoSuco),
        preco_lanche: toMoneyString(parsedInput.precoLanche),
      })
      .onConflictDoUpdate({
        target: configuracaoResumoDia.id,
        set: {
          cnpj: parsedInput.cnpj?.trim() || null,
          nome_estabelecimento: parsedInput.nomeEstabelecimento?.trim() || null,
          preco_cafe: toMoneyString(parsedInput.precoCafe),
          preco_suco: toMoneyString(parsedInput.precoSuco),
          preco_lanche: toMoneyString(parsedInput.precoLanche),
          updated_at: new Date(),
        },
      })

    revalidatePath('/configuracoes/impressao')
    return parsedInput
  })
