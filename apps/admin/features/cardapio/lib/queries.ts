import 'server-only'

import { unstable_cache } from 'next/cache'

import { db } from '@/lib/db'

import {
  TAG_CARDAPIO_CATALOGO,
  TAG_CARDAPIO_DIAS,
  tagCardapioExtrasEmpresa,
} from './cache-tags'
import type { CardapioDiaItem, ExtraEmpresaItem, PratoCatalogoItem } from './types'

/** Catálogo único do restaurante — não é mais por empresa. */
export const getCatalogo = unstable_cache(
  async (): Promise<PratoCatalogoItem[]> => {
    const rows = await db.query.pratoCardapio.findMany({
      orderBy: (p, { asc }) => [asc(p.nome)],
    })

    return rows.map((row) => ({
      id: row.id,
      nome: row.nome,
      ativo: row.ativo,
    }))
  },
  ['cardapio-catalogo'],
  { tags: [TAG_CARDAPIO_CATALOGO] }
)

/**
 * Cardápio já gerado num intervalo — único pro restaurante, com todas as
 * alternativas (não corta por empresa aqui; quem exibe pra empresa decide
 * quantas usar). Dias sem cardápio (ainda não gerados) simplesmente não
 * aparecem no array.
 */
export function getCardapioIntervalo(
  from: string,
  to: string
): Promise<CardapioDiaItem[]> {
  return unstable_cache(
    async (): Promise<CardapioDiaItem[]> => {
      const dias = await db.query.cardapioSemanaDia.findMany({
        where: (d, { and, gte, lte }) =>
          and(gte(d.data, from), lte(d.data, to)),
        orderBy: (d, { asc }) => [asc(d.data)],
        with: {
          itens: {
            orderBy: (i, { asc }) => [asc(i.ordem)],
            with: { prato: true },
          },
        },
      })

      return dias.map((dia) => {
        const destaqueRow = dia.itens.find((item) => item.destaque)
        const alternativas = dia.itens
          .filter((item) => !item.destaque)
          .map((item) => ({ id: item.prato.id, nome: item.prato.nome }))

        return {
          data: dia.data,
          destaque: destaqueRow
            ? { id: destaqueRow.prato.id, nome: destaqueRow.prato.nome }
            : null,
          alternativas,
        }
      })
    },
    ['cardapio-intervalo', from, to],
    { tags: [TAG_CARDAPIO_DIAS] }
  )()
}

/** Pratos extras cadastrados à mão pra uma empresa específica, num intervalo. */
export function getExtrasEmpresa(
  empresaId: string,
  from: string,
  to: string
): Promise<ExtraEmpresaItem[]> {
  return unstable_cache(
    async (): Promise<ExtraEmpresaItem[]> => {
      const rows = await db.query.empresaPratoExtra.findMany({
        where: (e, { and, eq: eqOp, gte, lte }) =>
          and(eqOp(e.empresa_id, empresaId), gte(e.data, from), lte(e.data, to)),
        orderBy: (e, { asc }) => [asc(e.data)],
        with: { prato: true },
      })

      return rows.map((row) => ({
        id: row.id,
        data: row.data,
        prato: { id: row.prato.id, nome: row.prato.nome },
      }))
    },
    ['cardapio-extras-empresa', empresaId, from, to],
    { tags: [tagCardapioExtrasEmpresa(empresaId)] }
  )()
}
