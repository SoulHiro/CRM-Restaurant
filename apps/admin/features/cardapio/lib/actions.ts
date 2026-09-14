'use server'

import { updateTag } from 'next/cache'

import { db } from '@/lib/db'
import { executarLote, type Statement } from '@/lib/db-batch'
import { ActionError, authActionClient } from '@/lib/safe-action'
import { somarDiasISO } from '@/lib/dates'
import {
  cardapioPratoFixo,
  cardapioSemanaDia,
  cardapioSemanaDiaItem,
  empresaPratoExtra,
  pratoCardapio,
} from '@repo/db'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

import {
  TAG_CARDAPIO_CATALOGO,
  TAG_CARDAPIO_DIAS,
  tagCardapioExtrasEmpresa,
} from './cache-tags'
import { diaDaSemanaISO } from './calendario-helpers'
import { getCardapioIntervalo, getCatalogo, getExtrasEmpresa } from './queries'
import {
  adicionarExtraEmpresaSchema,
  adicionarItemDiaSchema,
  atualizarPratoSchema,
  confirmarCardapioMesSchema,
  criarPratoSchema,
  desfixarItemSchema,
  fixarItemSchema,
  gerarPreviewCardapioSchema,
  listarCardapioIntervaloSchema,
  listarExtrasEmpresaSchema,
  marcarEspecialSchema,
  promoverDestaqueSchema,
  removerDestaqueSchema,
  removerExtraEmpresaSchema,
  removerItemDiaSchema,
  reordenarAlternativasSchema,
} from './schemas'
import {
  diasFixosFeijoada,
  diasSegundaASabado,
  gerarCardapioMes,
} from './sorteio-helpers'
import type { CardapioDiaPropostoInput } from './types'

/** Garante a linha do dia em `cardapio_semana_dia`, criando se ainda não existir. */
async function criarOuObterDiaId(data: string): Promise<string | null> {
  const [diaInserido] = await db
    .insert(cardapioSemanaDia)
    .values({ data })
    .onConflictDoNothing()
    .returning({ id: cardapioSemanaDia.id })

  if (diaInserido) return diaInserido.id

  const diaExistente = await db.query.cardapioSemanaDia.findFirst({
    where: (d, { eq: eqOp }) => eqOp(d.data, data),
    columns: { id: true },
  })
  return diaExistente?.id ?? null
}

/** Próxima posição livre no fim da lista de alternativas desse dia. */
async function proximaOrdemDoDia(diaId: string): Promise<number> {
  const itensAtuais = await db.query.cardapioSemanaDiaItem.findMany({
    where: (i, { eq: eqOp }) => eqOp(i.cardapio_semana_dia_id, diaId),
    columns: { ordem: true },
  })
  return itensAtuais.length === 0
    ? 0
    : Math.max(...itensAtuais.map((i) => i.ordem)) + 1
}

export const listarCatalogoAction = authActionClient
  .schema(z.object({}))
  .action(async () => {
    const catalogo = await getCatalogo()
    return { catalogo }
  })

export const criarPratoAction = authActionClient
  .schema(criarPratoSchema)
  .action(async ({ parsedInput }) => {
    const existente = await db.query.pratoCardapio.findFirst({
      where: (p, { eq: eqOp }) => eqOp(p.nome, parsedInput.nome.trim()),
      columns: { id: true },
    })
    if (existente) {
      throw new ActionError('Já existe um prato com esse nome.')
    }

    await db.insert(pratoCardapio).values({
      nome: parsedInput.nome.trim(),
      categoria: parsedInput.categoria,
    })

    updateTag(TAG_CARDAPIO_CATALOGO)
  })

export const atualizarPratoAction = authActionClient
  .schema(atualizarPratoSchema)
  .action(async ({ parsedInput }) => {
    await db
      .update(pratoCardapio)
      .set({
        nome: parsedInput.nome.trim(),
        ativo: parsedInput.ativo,
        categoria: parsedInput.categoria,
      })
      .where(eq(pratoCardapio.id, parsedInput.pratoId))

    updateTag(TAG_CARDAPIO_CATALOGO)
  })

export const listarCardapioIntervaloAction = authActionClient
  .schema(listarCardapioIntervaloSchema)
  .action(async ({ parsedInput }) => {
    const dias = await getCardapioIntervalo(parsedInput.from, parsedInput.to)
    return { dias }
  })

/**
 * Cria o dia (se ainda não existir) e adiciona o prato como uma nova
 * alternativa no fim da lista — é o que o drag-and-drop do catálogo pro
 * calendário chama a cada solto. `onConflictDoNothing` nos dois inserts:
 * o dia pode já existir (índice único em `data`), e o prato pode já estar
 * nesse dia (índice único em `dia_id`+`prato_catalogo_id`) — nesse segundo
 * caso a action falha com uma mensagem clara em vez de duplicar.
 */
export const adicionarItemDiaAction = authActionClient
  .schema(adicionarItemDiaSchema)
  .action(async ({ parsedInput }) => {
    const diaId = await criarOuObterDiaId(parsedInput.data)
    if (!diaId) throw new ActionError('Não foi possível preparar esse dia.')

    const proximaOrdem = await proximaOrdemDoDia(diaId)

    const [item] = await db
      .insert(cardapioSemanaDiaItem)
      .values({
        cardapio_semana_dia_id: diaId,
        prato_catalogo_id: parsedInput.pratoCatalogoId,
        destaque: false,
        ordem: proximaOrdem,
      })
      .onConflictDoNothing()
      .returning({ id: cardapioSemanaDiaItem.id })

    updateTag(TAG_CARDAPIO_DIAS)

    if (!item) throw new ActionError('Esse prato já está nesse dia.')

    return { diaId, itemId: item.id }
  })

export const removerItemDiaAction = authActionClient
  .schema(removerItemDiaSchema)
  .action(async ({ parsedInput }) => {
    await db
      .delete(cardapioSemanaDiaItem)
      .where(eq(cardapioSemanaDiaItem.id, parsedInput.itemId))

    updateTag(TAG_CARDAPIO_DIAS)
  })

/** `itemIds` já vem na ordem final (arrastada no calendário) — só grava o índice de cada um como `ordem`. */
export const reordenarAlternativasAction = authActionClient
  .schema(reordenarAlternativasSchema)
  .action(async ({ parsedInput }) => {
    await executarLote(
      parsedInput.itemIds.map((itemId, indice) =>
        db
          .update(cardapioSemanaDiaItem)
          .set({ ordem: indice })
          .where(eq(cardapioSemanaDiaItem.id, itemId))
      )
    )

    updateTag(TAG_CARDAPIO_DIAS)
  })

/** Só um destaque por dia — quem já era destaque vira alternativa comum, no fim da ordem. */
export const promoverDestaqueAction = authActionClient
  .schema(promoverDestaqueSchema)
  .action(async ({ parsedInput }) => {
    const itensDoDia = await db.query.cardapioSemanaDiaItem.findMany({
      where: (i, { eq: eqOp }) =>
        eqOp(i.cardapio_semana_dia_id, parsedInput.diaId),
      columns: { id: true, destaque: true, ordem: true },
    })

    const destaqueAtual = itensDoDia.find(
      (i) => i.destaque && i.id !== parsedInput.itemId
    )
    const maxOrdem = Math.max(0, ...itensDoDia.map((i) => i.ordem))

    const statements: Statement[] = []
    if (destaqueAtual) {
      statements.push(
        db
          .update(cardapioSemanaDiaItem)
          .set({ destaque: false, ordem: maxOrdem + 1 })
          .where(eq(cardapioSemanaDiaItem.id, destaqueAtual.id))
      )
    }
    statements.push(
      db
        .update(cardapioSemanaDiaItem)
        .set({ destaque: true, ordem: 0 })
        .where(eq(cardapioSemanaDiaItem.id, parsedInput.itemId))
    )

    await executarLote(statements)
    updateTag(TAG_CARDAPIO_DIAS)
  })

/** Tira o destaque desse dia sem promover ninguém no lugar — vira uma alternativa comum, no fim da ordem. */
export const removerDestaqueAction = authActionClient
  .schema(removerDestaqueSchema)
  .action(async ({ parsedInput }) => {
    const itensDoDia = await db.query.cardapioSemanaDiaItem.findMany({
      where: (i, { eq: eqOp }) =>
        eqOp(i.cardapio_semana_dia_id, parsedInput.diaId),
      columns: { ordem: true },
    })
    const maxOrdem = Math.max(0, ...itensDoDia.map((i) => i.ordem))

    await db
      .update(cardapioSemanaDiaItem)
      .set({ destaque: false, ordem: maxOrdem + 1 })
      .where(eq(cardapioSemanaDiaItem.id, parsedInput.itemId))

    updateTag(TAG_CARDAPIO_DIAS)
  })

/** Prato de custo mais alto — cobra o adicional "especial" (Valores) de quem escolher, independente de ser destaque ou alternativa. */
export const marcarEspecialAction = authActionClient
  .schema(marcarEspecialSchema)
  .action(async ({ parsedInput }) => {
    await db
      .update(cardapioSemanaDiaItem)
      .set({ especial: parsedInput.especial })
      .where(eq(cardapioSemanaDiaItem.id, parsedInput.itemId))

    updateTag(TAG_CARDAPIO_DIAS)
  })

const SEMANAS_MATERIALIZAR_FIXO = 8

/**
 * Fixa "esse prato repete todo [dia da semana]" e já materializa as
 * próximas 8 ocorrências. Se o prato fixado é o destaque (ex: feijoada toda
 * quarta e sábado), cada ocorrência futura também nasce como destaque —
 * contanto que aquele dia ainda não tenha um escolhido; se já tiver (o admin
 * adiantou e marcou outro prato do dia naquela semana), entra só como
 * alternativa comum, sem brigar pelo destaque. `onConflictDoUpdate` no item
 * faz a materialização ser idempotente E corrigir ocorrências que já
 * existiam de uma tentativa anterior (ex: um dia que já tinha o prato como
 * alternativa comum antes de virar fixo) — só ignorar o conflito deixaria
 * essas linhas antigas incoerentes com a regra atual pra sempre.
 */
export const fixarItemAction = authActionClient
  .schema(fixarItemSchema)
  .action(async ({ parsedInput }) => {
    const item = await db.query.cardapioSemanaDiaItem.findFirst({
      where: (i, { eq: eqOp }) => eqOp(i.id, parsedInput.itemId),
      with: { dia: true },
    })
    if (!item) throw new ActionError('Item não encontrado.')

    await db
      .update(cardapioSemanaDiaItem)
      .set({ fixo: true })
      .where(eq(cardapioSemanaDiaItem.id, item.id))

    const diaSemana = diaDaSemanaISO(item.dia.data)
    await db
      .insert(cardapioPratoFixo)
      .values({ dia_semana: diaSemana, prato_catalogo_id: item.prato_catalogo_id })
      .onConflictDoNothing()

    let data = item.dia.data
    for (let i = 0; i < SEMANAS_MATERIALIZAR_FIXO; i++) {
      data = somarDiasISO(data, 7)
      const diaId = await criarOuObterDiaId(data)
      if (!diaId) continue

      const destaqueExistente = await db.query.cardapioSemanaDiaItem.findFirst({
        where: (i, { and: andOp, eq: eqOp, ne: neOp }) =>
          andOp(
            eqOp(i.cardapio_semana_dia_id, diaId),
            eqOp(i.destaque, true),
            neOp(i.prato_catalogo_id, item.prato_catalogo_id)
          ),
        columns: { id: true },
      })
      const viraDestaque = item.destaque && !destaqueExistente
      const ordem = viraDestaque ? 0 : await proximaOrdemDoDia(diaId)

      await db
        .insert(cardapioSemanaDiaItem)
        .values({
          cardapio_semana_dia_id: diaId,
          prato_catalogo_id: item.prato_catalogo_id,
          destaque: viraDestaque,
          fixo: true,
          ordem,
        })
        .onConflictDoUpdate({
          target: [
            cardapioSemanaDiaItem.cardapio_semana_dia_id,
            cardapioSemanaDiaItem.prato_catalogo_id,
          ],
          set: { destaque: viraDestaque, fixo: true },
        })
    }

    updateTag(TAG_CARDAPIO_DIAS)
  })

/**
 * Desfaz a regra de recorrência — só impede novas semanas de receberem esse
 * prato automaticamente. As ocorrências já materializadas em semanas
 * futuras continuam lá (e continuam marcadas como fixo); quem quiser tirar
 * alguma específica remove o item normalmente.
 */
export const desfixarItemAction = authActionClient
  .schema(desfixarItemSchema)
  .action(async ({ parsedInput }) => {
    const item = await db.query.cardapioSemanaDiaItem.findFirst({
      where: (i, { eq: eqOp }) => eqOp(i.id, parsedInput.itemId),
      with: { dia: true },
    })
    if (!item) throw new ActionError('Item não encontrado.')

    await db
      .update(cardapioSemanaDiaItem)
      .set({ fixo: false })
      .where(eq(cardapioSemanaDiaItem.id, item.id))

    const diaSemana = diaDaSemanaISO(item.dia.data)
    await db
      .delete(cardapioPratoFixo)
      .where(
        and(
          eq(cardapioPratoFixo.dia_semana, diaSemana),
          eq(cardapioPratoFixo.prato_catalogo_id, item.prato_catalogo_id)
        )
      )

    updateTag(TAG_CARDAPIO_DIAS)
  })

export const listarExtrasEmpresaAction = authActionClient
  .schema(listarExtrasEmpresaSchema)
  .action(async ({ parsedInput }) => {
    const extras = await getExtrasEmpresa(
      parsedInput.empresaId,
      parsedInput.from,
      parsedInput.to
    )
    return { extras }
  })

export const adicionarExtraEmpresaAction = authActionClient
  .schema(adicionarExtraEmpresaSchema)
  .action(async ({ parsedInput }) => {
    await db
      .insert(empresaPratoExtra)
      .values({
        empresa_id: parsedInput.empresaId,
        data: parsedInput.data,
        prato_catalogo_id: parsedInput.pratoCatalogoId,
      })
      .onConflictDoNothing()

    updateTag(tagCardapioExtrasEmpresa(parsedInput.empresaId))
  })

export const removerExtraEmpresaAction = authActionClient
  .schema(removerExtraEmpresaSchema)
  .action(async ({ parsedInput }) => {
    const [removido] = await db
      .delete(empresaPratoExtra)
      .where(eq(empresaPratoExtra.id, parsedInput.extraId))
      .returning({ empresa_id: empresaPratoExtra.empresa_id })

    if (removido) updateTag(tagCardapioExtrasEmpresa(removido.empresa_id))
  })

/**
 * Só calcula e devolve a proposta — não grava nada. O admin revisa/edita no
 * preview (tela) e só persiste de fato via `confirmarCardapioMesAction`.
 */
export const gerarPreviewCardapioAction = authActionClient
  .schema(gerarPreviewCardapioSchema)
  .action(async ({ parsedInput }) => {
    const catalogo = await getCatalogo()
    const ativos = catalogo.filter((p) => p.ativo)

    if (ativos.length === 0) {
      throw new ActionError(
        'Cadastre pelo menos um prato no catálogo antes de gerar o cardápio.'
      )
    }

    const dias = diasSegundaASabado(parsedInput.from, parsedInput.to)
    const diasFixos = parsedInput.pratoFeijoadaId
      ? diasFixosFeijoada(dias, parsedInput.pratoFeijoadaId)
      : []

    const gerado = gerarCardapioMes(
      ativos,
      dias,
      diasFixos,
      parsedInput.itensPorDia
    )

    const nomePorId = new Map(catalogo.map((p) => [p.id, p.nome]))

    const proposta = dias.map((data) => {
      const dia = gerado.get(data)!
      return {
        data,
        destaque: { id: dia.destaqueId, nome: nomePorId.get(dia.destaqueId)! },
        alternativas: dia.alternativaIds.map((id) => ({
          id,
          nome: nomePorId.get(id)!,
        })),
      }
    })

    return { proposta }
  })

/**
 * Grava a proposta (já revisada/editada no preview). Sempre substitui: apaga
 * os itens que já existiam pra cada dia e recria do zero — mais simples que
 * diffar, e "gerar de novo" é justamente pra sobrescrever uma versão
 * anterior (ex: o admin ajustou um prato e quer regenerar o mês). A ordem
 * das alternativas no array vira a coluna `ordem` — é ela que decide quais
 * "sobram de fora" quando uma empresa mostra menos que o total gerado.
 *
 * Duas idas ao banco em vez de uma: `db.batch` do neon-http não deixa um
 * statement ler o resultado do anterior no mesmo lote, então primeiro
 * garante que toda linha de `cardapio_semana_dia` existe (upsert), depois
 * busca os ids reais pra montar o lote de itens.
 */
export const confirmarCardapioMesAction = authActionClient
  .schema(confirmarCardapioMesSchema)
  .action(async ({ parsedInput }) => {
    const dias = parsedInput.dias as CardapioDiaPropostoInput[]

    await executarLote(
      dias.map((dia) =>
        db
          .insert(cardapioSemanaDia)
          .values({ data: dia.data })
          .onConflictDoNothing()
      )
    )

    const diasGravados = await db.query.cardapioSemanaDia.findMany({
      where: (d, { inArray }) =>
        inArray(
          d.data,
          dias.map((dia) => dia.data)
        ),
      columns: { id: true, data: true },
    })
    const idPorData = new Map(diasGravados.map((d) => [d.data, d.id]))

    const statements: Statement[] = []
    for (const dia of dias) {
      const diaId = idPorData.get(dia.data)
      if (!diaId)
        throw new ActionError(`Não foi possível salvar o dia ${dia.data}.`)

      statements.push(
        db
          .delete(cardapioSemanaDiaItem)
          .where(eq(cardapioSemanaDiaItem.cardapio_semana_dia_id, diaId))
      )
      statements.push(
        db.insert(cardapioSemanaDiaItem).values([
          {
            cardapio_semana_dia_id: diaId,
            prato_catalogo_id: dia.destaqueId,
            destaque: true,
            ordem: 0,
          },
          ...dia.alternativaIds.map((id, indice) => ({
            cardapio_semana_dia_id: diaId,
            prato_catalogo_id: id,
            destaque: false,
            ordem: indice + 1,
          })),
        ])
      )
    }

    await executarLote(statements)

    updateTag(TAG_CARDAPIO_DIAS)
  })
