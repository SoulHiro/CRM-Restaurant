import 'server-only'

import { unstable_cache } from 'next/cache'

import { db } from '@/lib/db'

import { tagCardapioCatalogo, tagCardapioDias } from './cache-tags'
import type { CardapioDiaItem, PratoCatalogoItem } from './types'

export function getCatalogoEmpresa(
  empresaId: string
): Promise<PratoCatalogoItem[]> {
  return unstable_cache(
    async (): Promise<PratoCatalogoItem[]> => {
      const rows = await db.query.pratoCardapio.findMany({
        where: (p, { eq }) => eq(p.empresa_id, empresaId),
        orderBy: (p, { asc }) => [asc(p.nome)],
      })

      return rows.map((row) => ({
        id: row.id,
        nome: row.nome,
        ativo: row.ativo,
      }))
    },
    ['cardapio-catalogo', empresaId],
    { tags: [tagCardapioCatalogo(empresaId)] }
  )()
}

/** Cardápio já gerado num intervalo — dias sem cardápio (ainda não gerados) simplesmente não aparecem no array. */
export function getCardapioIntervalo(
  empresaId: string,
  from: string,
  to: string
): Promise<CardapioDiaItem[]> {
  return unstable_cache(
    async (): Promise<CardapioDiaItem[]> => {
      const dias = await db.query.cardapioSemanaDia.findMany({
        where: (d, { and, eq, gte, lte }) =>
          and(eq(d.empresa_id, empresaId), gte(d.data, from), lte(d.data, to)),
        orderBy: (d, { asc }) => [asc(d.data)],
        with: {
          itens: {
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
    ['cardapio-intervalo', empresaId, from, to],
    { tags: [tagCardapioDias(empresaId)] }
  )()
}
