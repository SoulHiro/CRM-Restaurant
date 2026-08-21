'use server'

import { updateTag } from 'next/cache'

import { db } from '@/lib/db'
import { executarLote, type Statement } from '@/lib/db-batch'
import { ActionError, authActionClient } from '@/lib/safe-action'
import {
  cardapioSemanaDia,
  cardapioSemanaDiaItem,
  pratoCardapio,
} from '@repo/db'
import { eq } from 'drizzle-orm'

import { tagCardapioCatalogo, tagCardapioDias } from './cache-tags'
import { getCardapioIntervalo, getCatalogoEmpresa } from './queries'
import {
  atualizarPratoSchema,
  confirmarCardapioMesSchema,
  criarPratoSchema,
  gerarPreviewCardapioSchema,
  listarCardapioIntervaloSchema,
  listarCatalogoSchema,
} from './schemas'
import {
  diasFixosFeijoada,
  diasSegundaASabado,
  gerarCardapioMes,
} from './sorteio-helpers'
import type { CardapioDiaPropostoInput } from './types'

export const listarCatalogoAction = authActionClient
  .schema(listarCatalogoSchema)
  .action(async ({ parsedInput }) => {
    const catalogo = await getCatalogoEmpresa(parsedInput.empresaId)
    return { catalogo }
  })

export const criarPratoAction = authActionClient
  .schema(criarPratoSchema)
  .action(async ({ parsedInput }) => {
    const existente = await db.query.pratoCardapio.findFirst({
      where: (p, { and, eq: eqOp }) =>
        and(
          eqOp(p.empresa_id, parsedInput.empresaId),
          eqOp(p.nome, parsedInput.nome.trim())
        ),
      columns: { id: true },
    })
    if (existente) {
      throw new ActionError('Já existe um prato com esse nome.')
    }

    await db.insert(pratoCardapio).values({
      empresa_id: parsedInput.empresaId,
      nome: parsedInput.nome.trim(),
    })

    updateTag(tagCardapioCatalogo(parsedInput.empresaId))
  })

export const atualizarPratoAction = authActionClient
  .schema(atualizarPratoSchema)
  .action(async ({ parsedInput }) => {
    const [atualizado] = await db
      .update(pratoCardapio)
      .set({ nome: parsedInput.nome.trim(), ativo: parsedInput.ativo })
      .where(eq(pratoCardapio.id, parsedInput.pratoId))
      .returning({ empresa_id: pratoCardapio.empresa_id })

    if (atualizado) updateTag(tagCardapioCatalogo(atualizado.empresa_id))
  })

export const listarCardapioIntervaloAction = authActionClient
  .schema(listarCardapioIntervaloSchema)
  .action(async ({ parsedInput }) => {
    const dias = await getCardapioIntervalo(
      parsedInput.empresaId,
      parsedInput.from,
      parsedInput.to
    )
    return { dias }
  })

/**
 * Só calcula e devolve a proposta — não grava nada. O admin revisa/edita no
 * preview (tela) e só persiste de fato via `confirmarCardapioMesAction`.
 */
export const gerarPreviewCardapioAction = authActionClient
  .schema(gerarPreviewCardapioSchema)
  .action(async ({ parsedInput }) => {
    const catalogo = await getCatalogoEmpresa(parsedInput.empresaId)
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
 * anterior (ex: o admin ajustou um prato e quer regenerar o mês).
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
          .values({ empresa_id: parsedInput.empresaId, data: dia.data })
          .onConflictDoNothing()
      )
    )

    const diasGravados = await db.query.cardapioSemanaDia.findMany({
      where: (d, { and, eq: eqOp, inArray }) =>
        and(
          eqOp(d.empresa_id, parsedInput.empresaId),
          inArray(
            d.data,
            dias.map((dia) => dia.data)
          )
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
          },
          ...dia.alternativaIds.map((id) => ({
            cardapio_semana_dia_id: diaId,
            prato_catalogo_id: id,
            destaque: false,
          })),
        ])
      )
    }

    await executarLote(statements)

    updateTag(tagCardapioDias(parsedInput.empresaId))
  })
