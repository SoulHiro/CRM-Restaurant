import { relations } from 'drizzle-orm'
import {
  boolean,
  date,
  pgTable,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'

import { empresa } from './empresa'

/**
 * Cardápio semanal por empresa-cliente (GPK, CANÚBIO, COFEL...) — domínio
 * distinto do `cardapio_dia`/`prato`/`item_adicional` já existentes em
 * `cardapio.ts`/`pedido.ts` (aquilo é o esqueleto ainda não usado de um
 * cardápio de delivery/PDV, single-tenant, com ficha técnica e adicionais;
 * este aqui é multi-tenant, um "prato do dia" + alternativas por empresa,
 * pensado pra substituir os Google Forms semanais).
 *
 * Pool de pratos de uma empresa (~20, o suficiente pra um mês inteiro sem
 * repetir "prato do dia") — o catálogo em si não muda semana a semana, só a
 * escolha de quem vira destaque/alternativa em cada dia (`cardapio_semana_dia`).
 */
export const pratoCardapio = pgTable(
  'prato_cardapio',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    empresa_id: text('empresa_id')
      .notNull()
      .references(() => empresa.id, { onDelete: 'cascade' }),
    nome: text('nome').notNull(),
    ativo: boolean('ativo').notNull().default(true),
    created_at: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [unique().on(t.empresa_id, t.nome)]
)

/** Um dia de calendário do cardápio gerado — a lista de pratos daquele dia mora em `cardapio_semana_dia_item`. */
export const cardapioSemanaDia = pgTable(
  'cardapio_semana_dia',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    empresa_id: text('empresa_id')
      .notNull()
      .references(() => empresa.id, { onDelete: 'cascade' }),
    data: date('data').notNull(),
  },
  (t) => [unique().on(t.empresa_id, t.data)]
)

/** `destaque = true` é o "prato do dia" — só um por `cardapio_semana_dia`, os demais são alternativa. */
export const cardapioSemanaDiaItem = pgTable(
  'cardapio_semana_dia_item',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    cardapio_semana_dia_id: text('cardapio_semana_dia_id')
      .notNull()
      .references(() => cardapioSemanaDia.id, { onDelete: 'cascade' }),
    prato_catalogo_id: text('prato_catalogo_id')
      .notNull()
      .references(() => pratoCardapio.id, { onDelete: 'cascade' }),
    destaque: boolean('destaque').notNull().default(false),
  },
  (t) => [unique().on(t.cardapio_semana_dia_id, t.prato_catalogo_id)]
)

export const pratoCardapioRelations = relations(pratoCardapio, ({ one }) => ({
  empresa: one(empresa, {
    fields: [pratoCardapio.empresa_id],
    references: [empresa.id],
  }),
}))

export const cardapioSemanaDiaRelations = relations(
  cardapioSemanaDia,
  ({ one, many }) => ({
    empresa: one(empresa, {
      fields: [cardapioSemanaDia.empresa_id],
      references: [empresa.id],
    }),
    itens: many(cardapioSemanaDiaItem),
  })
)

export const cardapioSemanaDiaItemRelations = relations(
  cardapioSemanaDiaItem,
  ({ one }) => ({
    dia: one(cardapioSemanaDia, {
      fields: [cardapioSemanaDiaItem.cardapio_semana_dia_id],
      references: [cardapioSemanaDia.id],
    }),
    prato: one(pratoCardapio, {
      fields: [cardapioSemanaDiaItem.prato_catalogo_id],
      references: [pratoCardapio.id],
    }),
  })
)
