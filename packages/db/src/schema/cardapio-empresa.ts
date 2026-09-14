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

import { empresa } from './empresa'

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
    /** 'aves' | 'bovinos' | 'suinos' | 'peixes' | 'massas' | 'saladas' | 'outros' — validado em `lib/schemas.ts`, não como pg enum, pra adicionar categoria nova ser só código. */
    categoria: text('categoria').notNull().default('outros'),
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
    /** Prato de custo mais alto — cobra um adicional fixo (cadastrado em Valores) de quem escolher, independente de ser destaque ou alternativa. */
    especial: boolean('especial').notNull().default(false),
    /** Marcado por um pin em `cardapio_prato_fixo` — só reflete a regra, não é a fonte dela. */
    fixo: boolean('fixo').notNull().default(false),
    ordem: integer('ordem').notNull().default(0),
  },
  (t) => [unique().on(t.cardapio_semana_dia_id, t.prato_catalogo_id)]
)

/**
 * Regra "esse prato repete toda [dia da semana]" — fixada a partir do pin no
 * calendário. É a fonte de verdade da recorrência; `cardapio_semana_dia_item.fixo`
 * só marca quais linhas já materializadas vieram dela. Materializar (inserir
 * o item nas próximas semanas) é responsabilidade da action que cria a
 * regra, não de uma leitura — assim o calendário continua só lendo
 * `cardapio_semana_dia_item` normalmente, sem lógica de recorrência no
 * caminho de leitura.
 */
export const cardapioPratoFixo = pgTable(
  'cardapio_prato_fixo',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    /** 0 = domingo .. 6 = sábado (sorteio nunca usa domingo, mas o pin pode ser fixado em qualquer dia que já tenha cardápio). */
    dia_semana: integer('dia_semana').notNull(),
    prato_catalogo_id: text('prato_catalogo_id')
      .notNull()
      .references(() => pratoCardapio.id, { onDelete: 'cascade' }),
    created_at: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [unique().on(t.dia_semana, t.prato_catalogo_id)]
)

/**
 * Prato extra exclusivo de uma empresa — contrato específico (ex: LNR) que
 * soma uma opção a mais só pra ela, por cima do conjunto comum do dia.
 * Nunca entra no sorteio (`sorteio-helpers.ts`) nem no corte de
 * `empresa.cardapio_qtd_alternativas` — é sempre cadastrado à mão e sempre
 * aparece pra essa empresa, independente de quantas alternativas comuns ela
 * mostra. Reaproveita o catálogo único (`prato_cardapio`) em vez de um
 * catálogo próprio, pra não duplicar cadastro de prato.
 */
export const empresaPratoExtra = pgTable(
  'empresa_prato_extra',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    empresa_id: text('empresa_id')
      .notNull()
      .references(() => empresa.id, { onDelete: 'cascade' }),
    data: date('data').notNull(),
    prato_catalogo_id: text('prato_catalogo_id')
      .notNull()
      .references(() => pratoCardapio.id, { onDelete: 'cascade' }),
    created_at: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [unique().on(t.empresa_id, t.data, t.prato_catalogo_id)]
)

export const empresaPratoExtraRelations = relations(
  empresaPratoExtra,
  ({ one }) => ({
    empresa: one(empresa, {
      fields: [empresaPratoExtra.empresa_id],
      references: [empresa.id],
    }),
    prato: one(pratoCardapio, {
      fields: [empresaPratoExtra.prato_catalogo_id],
      references: [pratoCardapio.id],
    }),
  })
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
