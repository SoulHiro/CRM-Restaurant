'use server'

import { revalidatePath, updateTag } from 'next/cache'

import { db } from '@/lib/db'
import { authActionClient, tenantActionClient } from '@/lib/safe-action'
import {
  configuracaoComanda,
  configuracaoHorarioFuncionamento,
  configuracaoPesagem,
  configuracaoPrecificacao,
  configuracaoResumoDia,
  impressora,
} from '@repo/db'

import {
  TAG_CONFIGURACAO_IMPRESSAO,
  TAG_CONFIGURACAO_PESAGEM,
} from '@/features/empresas/lib/cache-tags'
import {
  getConfiguracaoComanda,
  getConfiguracaoHorarioFuncionamento,
  getConfiguracaoLayoutResumo,
  getConfiguracaoPesagem,
  getConfiguracaoPrecificacao,
  getConfiguracaoResumoDia,
  listarImpressorasComanda,
  listarImpressorasPesagem,
} from './queries'
import {
  criarImpressoraSchema,
  listarImpressorasComandaSchema,
  listarImpressorasPesagemSchema,
  obterConfiguracaoComandaSchema,
  obterConfiguracaoHorarioFuncionamentoSchema,
  obterConfiguracaoLayoutResumoSchema,
  obterConfiguracaoPesagemSchema,
  obterConfiguracaoPrecificacaoSchema,
  obterConfiguracaoResumoDiaSchema,
  salvarConfiguracaoComandaSchema,
  salvarConfiguracaoHorarioFuncionamentoSchema,
  salvarConfiguracaoPesagemSchema,
  salvarConfiguracaoPrecificacaoSchema,
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

export const listarImpressorasPesagemAction = authActionClient
  .schema(listarImpressorasPesagemSchema)
  .action(async () => {
    const impressoras = await listarImpressorasPesagem()
    return { impressoras }
  })

export const criarImpressoraAction = authActionClient
  .schema(criarImpressoraSchema)
  .action(async ({ parsedInput }) => {
    const [criada] = await db
      .insert(impressora)
      .values({
        nome: parsedInput.nome.trim(),
        tipo: parsedInput.tipo,
        identificador_qz: parsedInput.identificadorQz,
        ativo: true,
      })
      .returning({ id: impressora.id, nome: impressora.nome })

    revalidatePath('/configuracoes/impressao')
    updateTag(TAG_CONFIGURACAO_IMPRESSAO)
    updateTag(TAG_CONFIGURACAO_PESAGEM)
    return criada
  })

export const obterConfiguracaoPesagemAction = authActionClient
  .schema(obterConfiguracaoPesagemSchema)
  .action(async () => {
    return getConfiguracaoPesagem()
  })

export const salvarConfiguracaoPesagemAction = authActionClient
  .schema(salvarConfiguracaoPesagemSchema)
  .action(async ({ parsedInput }) => {
    await db
      .insert(configuracaoPesagem)
      .values({ id: 'default', impressora_id: parsedInput.impressoraId })
      .onConflictDoUpdate({
        target: configuracaoPesagem.id,
        set: {
          impressora_id: parsedInput.impressoraId,
          updated_at: new Date(),
        },
      })

    revalidatePath('/configuracoes/impressao')
    updateTag(TAG_CONFIGURACAO_PESAGEM)
    return { impressoraId: parsedInput.impressoraId }
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
    return {
      campos: parsedInput.campos,
      impressoraId: parsedInput.impressoraId,
    }
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

export const obterConfiguracaoHorarioFuncionamentoAction = authActionClient
  .schema(obterConfiguracaoHorarioFuncionamentoSchema)
  .action(async () => {
    return getConfiguracaoHorarioFuncionamento()
  })

export const salvarConfiguracaoHorarioFuncionamentoAction = authActionClient
  .schema(salvarConfiguracaoHorarioFuncionamentoSchema)
  .action(async ({ parsedInput }) => {
    const valores = {
      almoco_inicio: parsedInput.almocoInicio,
      almoco_fim: parsedInput.almocoFim,
      janta_inicio: parsedInput.jantaInicio,
      janta_fim: parsedInput.jantaFim,
      delivery_abre: parsedInput.deliveryAbre,
      delivery_fecha: parsedInput.deliveryFecha,
      local_abre: parsedInput.localAbre,
      local_fecha: parsedInput.localFecha,
    }

    await db
      .insert(configuracaoHorarioFuncionamento)
      .values({ id: 'default', ...valores })
      .onConflictDoUpdate({
        target: configuracaoHorarioFuncionamento.id,
        set: { ...valores, updated_at: new Date() },
      })

    revalidatePath('/configuracoes/funcionamento')
    return parsedInput
  })

export const obterConfiguracaoPrecificacaoAction = tenantActionClient
  .schema(obterConfiguracaoPrecificacaoSchema)
  .action(async ({ ctx }) => {
    return getConfiguracaoPrecificacao(ctx.organizationId)
  })

export const salvarConfiguracaoPrecificacaoAction = tenantActionClient
  .schema(salvarConfiguracaoPrecificacaoSchema)
  .action(async ({ parsedInput, ctx }) => {
    await db
      .insert(configuracaoPrecificacao)
      .values({
        organization_id: ctx.organizationId,
        custo_operacional_por_minuto:
          parsedInput.custoOperacionalPorMinuto.toFixed(2),
        limiar_amarelo_pct: parsedInput.limiarAmareloPct.toFixed(2),
        limiar_verde_pct: parsedInput.limiarVerdePct.toFixed(2),
        limiar_azul_pct: parsedInput.limiarAzulPct.toFixed(2),
        limiar_roxo_pct: parsedInput.limiarRoxoPct.toFixed(2),
      })
      .onConflictDoUpdate({
        target: configuracaoPrecificacao.organization_id,
        set: {
          custo_operacional_por_minuto:
            parsedInput.custoOperacionalPorMinuto.toFixed(2),
          limiar_amarelo_pct: parsedInput.limiarAmareloPct.toFixed(2),
          limiar_verde_pct: parsedInput.limiarVerdePct.toFixed(2),
          limiar_azul_pct: parsedInput.limiarAzulPct.toFixed(2),
          limiar_roxo_pct: parsedInput.limiarRoxoPct.toFixed(2),
          updated_at: new Date(),
        },
      })

    revalidatePath('/configuracoes/precificacao')
    return parsedInput
  })
