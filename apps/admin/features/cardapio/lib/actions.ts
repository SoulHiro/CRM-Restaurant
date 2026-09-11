'use server'

import { updateTag } from 'next/cache'

import { db } from '@/lib/db'
import { executarLote, type Statement } from '@/lib/db-batch'
import { ActionError, authActionClient } from '@/lib/safe-action'
import {
  cardapioSemanaDia,
  cardapioSemanaDiaItem,
  empresaPratoExtra,
  pratoCardapio,
} from '@repo/db'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

import {
  TAG_CARDAPIO_CATALOGO,
  TAG_CARDAPIO_DIAS,
  tagCardapioExtrasEmpresa,
} from './cache-tags'
import { getCardapioIntervalo, getCatalogo, getExtrasEmpresa } from './queries'
import {
  adicionarExtraEmpresaSchema,
  atualizarPratoSchema,
  confirmarCardapioMesSchema,
  criarPratoSchema,
  gerarPreviewCardapioSchema,
  listarCardapioIntervaloSchema,
  listarExtrasEmpresaSchema,
  removerExtraEmpresaSchema,
} from './schemas'
import {
  diasFixosFeijoada,
  diasSegundaASabado,
  gerarCardapioMes,
} from './sorteio-helpers'
import type { CardapioDiaPropostoInput } from './types'

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

    await db.insert(pratoCardapio).values({ nome: parsedInput.nome.trim() })

    updateTag(TAG_CARDAPIO_CATALOGO)
  })

export const atualizarPratoAction = authActionClient
  .schema(atualizarPratoSchema)
  .action(async ({ parsedInput }) => {
    await db
      .update(pratoCardapio)
      .set({ nome: parsedInput.nome.trim(), ativo: parsedInput.ativo })
      .where(eq(pratoCardapio.id, parsedInput.pratoId))

    updateTag(TAG_CARDAPIO_CATALOGO)
  })

export const listarCardapioIntervaloAction = authActionClient
  .schema(listarCardapioIntervaloSchema)
  .action(async ({ parsedInput }) => {
    const dias = await getCardapioIntervalo(parsedInput.from, parsedInput.to)
    return { dias }
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
