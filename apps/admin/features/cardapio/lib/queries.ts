import 'server-only'

import { unstable_cache } from 'next/cache'

import { db } from '@/lib/db'

import { TAG_CARDAPIO_CATALOGO, TAG_CARDAPIO_DIAS } from './cache-tags'
import type { CardapioDiaItem, PratoCatalogoItem } from './types'

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
