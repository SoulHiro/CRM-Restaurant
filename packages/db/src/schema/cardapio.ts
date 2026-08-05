import {
  boolean,
  date,
  numeric,
  pgEnum,
  pgTable,
  text,
  unique,
} from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'

export const tamanhoEnum = pgEnum('tamanho', ['P', 'M', 'G'])

export const categoria_prato = pgTable('categoria_prato', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  nome: text('nome').notNull(),
})

export const prato = pgTable('prato', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  nome: text('nome').notNull(),
  categoria_id: text('categoria_id')
    .notNull()
    .references(() => categoria_prato.id),
})

export const prato_tamanho_preco = pgTable(
  'prato_tamanho_preco',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    prato_id: text('prato_id')
      .notNull()
      .references(() => prato.id),
    tamanho: tamanhoEnum('tamanho').notNull(),
    preco: numeric('preco').notNull(),
    external_code: text('external_code'),
  },
  (t) => [unique().on(t.prato_id, t.tamanho)]
)

export const item_adicional = pgTable('item_adicional', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  nome: text('nome').notNull(),
  preco: numeric('preco').notNull(),
  external_code: text('external_code'),
})

export const ficha_tecnica_item = pgTable('ficha_tecnica_item', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  prato_id: text('prato_id')
    .notNull()
    .references(() => prato.id),
  tamanho: tamanhoEnum('tamanho').notNull(),
  insumo: text('insumo').notNull(),
  quantidade: numeric('quantidade').notNull(),
  unidade: text('unidade').notNull(),
})

export const cardapio_dia = pgTable(
  'cardapio_dia',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    data: date('data').notNull(),
    prato_id: text('prato_id')
      .notNull()
      .references(() => prato.id),
    destaque: boolean('destaque').notNull().default(false),
  },
  (t) => [unique().on(t.data, t.prato_id)]
)
