import { relations } from 'drizzle-orm'
import {
  boolean,
  date,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'

/**
 * Cardápio semanal do restaurante — domínio distinto do `cardapio_dia`/
 * `prato`/`item_adicional` já existentes em `cardapio.ts`/`pedido.ts`
 * (aquilo é o esqueleto ainda não usado de um cardápio de delivery/PDV,
 * single-tenant, com ficha técnica e adicionais; este aqui é pensado pra
 * substituir os Google Forms semanais das empresas-cliente).
 *
 * Único pro restaurante inteiro, não por empresa: o prato do dia é o mesmo
 * pra todo mundo (é a mesma cozinha), e as alternativas também vêm do mesmo
 * conjunto gerado por dia — o que muda de empresa pra empresa é só quantas
 * dessas alternativas aparecem pra ela (`empresa.cardapio_qtd_alternativas`),
 * não quais são.
 */
export const pratoCardapio = pgTable(
  'prato_cardapio',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    nome: text('nome').notNull(),
    ativo: boolean('ativo').notNull().default(true),
    created_at: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [unique().on(t.nome)]
)

/** Um dia de calendário do cardápio gerado — a lista de pratos daquele dia mora em `cardapio_semana_dia_item`. */
export const cardapioSemanaDia = pgTable(
  'cardapio_semana_dia',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    data: date('data').notNull(),
  },
  (t) => [unique().on(t.data)]
)

/**
 * `destaque = true` é o "prato do dia" (só um por dia). Os demais são
 * alternativa, com `ordem` marcando a posição — cada empresa mostra só as
 * `N` primeiras (`empresa.cardapio_qtd_alternativas`), então a ordem é o que
 * decide quem "sobra de fora" pras empresas com menos vagas.
 */
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
    ordem: integer('ordem').notNull().default(0),
  },
  (t) => [unique().on(t.cardapio_semana_dia_id, t.prato_catalogo_id)]
)

export const cardapioSemanaDiaRelations = relations(
  cardapioSemanaDia,
  ({ many }) => ({
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
