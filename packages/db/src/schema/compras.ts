import { relations } from 'drizzle-orm'
import {
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'

import { user } from './auth'
import { estoque_item, historico_preco_insumo } from './estoque'
import { despesaSubtipoEnum } from './financeiro'
import { fornecedor } from './fornecedor'

export const compraStatusEnum = pgEnum('compra_status', [
  'pedido_feito',
  'aguardando_entrega',
  'recebido',
  'cancelado',
])

export const avaliacaoFornecedorTipoEnum = pgEnum('avaliacao_fornecedor_tipo', [
  'atraso',
  'qualidade',
  'produto_vencido',
  'outro',
])

const QUANTIDADE = { precision: 12, scale: 3 } as const
const DINHEIRO = { precision: 12, scale: 2 } as const

/**
 * Cabeçalho de uma nota fiscal de compra. O desenho original previa um
 * registro por item, mas uma NF real é uma entrega e um pagamento só — os
 * itens vivem em `compra_item`. Mesma decisão do inventário físico.
 */
export const compra = pgTable(
  'compra',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    fornecedor_id: text('fornecedor_id')
      .notNull()
      .references(() => fornecedor.id),
    numero_nota_fiscal: text('numero_nota_fiscal'),
    // Vercel Blob — o campo nasce aqui, o upload liga quando houver token.
    arquivo_nota_fiscal: text('arquivo_nota_fiscal'),
    categoria_despesa: despesaSubtipoEnum('categoria_despesa')
      .notNull()
      .default('insumo'),
    status: compraStatusEnum('status').notNull().default('pedido_feito'),
    data_pedido: date('data_pedido').notNull(),
    data_recebimento: date('data_recebimento'),
    forma_pagamento: text('forma_pagamento'),
    observacao: text('observacao'),
    user_id: text('user_id').references(() => user.id),
    created_at: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('compra_status_data_idx').on(t.status, t.data_pedido),
    index('compra_fornecedor_idx').on(t.fornecedor_id),
  ]
)

export const compra_item = pgTable(
  'compra_item',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    compra_id: text('compra_id')
      .notNull()
      .references(() => compra.id, { onDelete: 'cascade' }),
    estoque_item_id: text('estoque_item_id')
      .notNull()
      .references(() => estoque_item.id),
    quantidade: numeric('quantidade', QUANTIDADE).notNull(),
    valor_unitario: numeric('valor_unitario', DINHEIRO).notNull(),
    // O total da linha é derivado (quantidade × valor unitário), nunca
    // guardado — guardar abriria espaço para os dois discordarem.
  },
  (t) => [
    unique().on(t.compra_id, t.estoque_item_id),
    index('compra_item_compra_idx').on(t.compra_id),
  ]
)

/**
 * Preço e prazo de cada fornecedor para um insumo. Permite comparar antes de
 * comprar e ter plano B quando o fornecedor habitual falta — por isso é N:N,
 * e não só o `fornecedor_padrao_id` que já existe em `estoque_item`.
 */
export const fornecedor_item = pgTable(
  'fornecedor_item',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    fornecedor_id: text('fornecedor_id')
      .notNull()
      .references(() => fornecedor.id, { onDelete: 'cascade' }),
    estoque_item_id: text('estoque_item_id')
      .notNull()
      .references(() => estoque_item.id, { onDelete: 'cascade' }),
    preco: numeric('preco', DINHEIRO).notNull(),
    prazo_entrega_dias: integer('prazo_entrega_dias'),
    observacao: text('observacao'),
    created_at: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    unique().on(t.fornecedor_id, t.estoque_item_id),
    index('fornecedor_item_item_idx').on(t.estoque_item_id),
  ]
)

export const avaliacao_fornecedor = pgTable(
  'avaliacao_fornecedor',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    fornecedor_id: text('fornecedor_id')
      .notNull()
      .references(() => fornecedor.id, { onDelete: 'cascade' }),
    data: date('data').notNull(),
    nota: integer('nota').notNull(),
    tipo: avaliacaoFornecedorTipoEnum('tipo').notNull(),
    observacao: text('observacao'),
    user_id: text('user_id').references(() => user.id),
    created_at: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('avaliacao_fornecedor_idx').on(t.fornecedor_id, t.data)]
)

/**
 * Declarado aqui, e não em `estoque.ts`, porque precisa enxergar as tabelas
 * desta fase — e `estoque.ts` não pode importar este arquivo sem criar ciclo.
 */
export const fornecedorRelations = relations(fornecedor, ({ many }) => ({
  itensPadrao: many(estoque_item),
  precos: many(historico_preco_insumo),
  compras: many(compra),
  itensFornecidos: many(fornecedor_item),
  avaliacoes: many(avaliacao_fornecedor),
}))

export const compraRelations = relations(compra, ({ one, many }) => ({
  fornecedor: one(fornecedor, {
    fields: [compra.fornecedor_id],
    references: [fornecedor.id],
  }),
  itens: many(compra_item),
  usuario: one(user, {
    fields: [compra.user_id],
    references: [user.id],
  }),
}))

export const compraItemRelations = relations(compra_item, ({ one }) => ({
  compra: one(compra, {
    fields: [compra_item.compra_id],
    references: [compra.id],
  }),
  item: one(estoque_item, {
    fields: [compra_item.estoque_item_id],
    references: [estoque_item.id],
  }),
}))

export const fornecedorItemRelations = relations(fornecedor_item, ({ one }) => ({
  fornecedor: one(fornecedor, {
    fields: [fornecedor_item.fornecedor_id],
    references: [fornecedor.id],
  }),
  item: one(estoque_item, {
    fields: [fornecedor_item.estoque_item_id],
    references: [estoque_item.id],
  }),
}))

export const avaliacaoFornecedorRelations = relations(
  avaliacao_fornecedor,
  ({ one }) => ({
    fornecedor: one(fornecedor, {
      fields: [avaliacao_fornecedor.fornecedor_id],
      references: [fornecedor.id],
    }),
    usuario: one(user, {
      fields: [avaliacao_fornecedor.user_id],
      references: [user.id],
    }),
  })
)
