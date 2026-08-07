import { relations } from 'drizzle-orm'
import {
  boolean,
  date,
  index,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'

import { user } from './auth'
import { fornecedor } from './fornecedor'

export const unidadeEstoqueEnum = pgEnum('unidade_estoque', [
  'un',
  'kg',
  'g',
  'l',
  'ml',
  'cx',
  'pct',
])

export const movimentoEstoqueTipoEnum = pgEnum('movimento_estoque_tipo', [
  'entrada_compra',
  'perda',
  'ajuste_inventario',
  'baixa_venda',
  'ajuste_manual',
])

export const perdaMotivoEnum = pgEnum('perda_motivo', [
  'vencido',
  'quebra',
  'erro_preparo',
  'outro',
])

export const inventarioStatusEnum = pgEnum('inventario_status', [
  'em_andamento',
  'finalizado',
])

const QUANTIDADE = { precision: 12, scale: 3 } as const
const PRECO = { precision: 12, scale: 2 } as const

export const estoque_item = pgTable(
  'estoque_item',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    nome: text('nome').notNull(),
    unidade: unidadeEstoqueEnum('unidade').notNull(),
    quantidade_atual: numeric('quantidade_atual', QUANTIDADE)
      .notNull()
      .default('0'),
    ponto_reposicao: numeric('ponto_reposicao', QUANTIDADE)
      .notNull()
      .default('0'),
    // Tamanho da embalagem em que o item costuma chegar (ex: garrafa de 900,
    // saco de 5) — metadado próprio, nunca usado para recalcular
    // quantidade_atual depois do cadastro (esse fica só sob o livro-razão).
    tamanho_embalagem: numeric('tamanho_embalagem', QUANTIDADE),
    validade: date('validade'),
    fornecedor_padrao_id: text('fornecedor_padrao_id').references(
      () => fornecedor.id
    ),
    ativo: boolean('ativo').notNull().default(true),
    created_at: timestamp('created_at').notNull().defaultNow(),
    updated_at: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index('estoque_item_nome_idx').on(t.nome),
    index('estoque_item_ativo_idx').on(t.ativo),
    index('estoque_item_validade_idx').on(t.validade),
  ]
)

export const estoque_movimento = pgTable(
  'estoque_movimento',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    estoque_item_id: text('estoque_item_id')
      .notNull()
      .references(() => estoque_item.id, { onDelete: 'cascade' }),
    tipo: movimentoEstoqueTipoEnum('tipo').notNull(),
    // assinada: negativa em saída (perda, baixa de venda, ajuste para baixo)
    quantidade: numeric('quantidade', QUANTIDADE).notNull(),
    saldo_resultante: numeric('saldo_resultante', QUANTIDADE).notNull(),
    origem_tipo: text('origem_tipo'),
    origem_id: text('origem_id'),
    observacao: text('observacao'),
    user_id: text('user_id').references(() => user.id),
    created_at: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('estoque_movimento_item_data_idx').on(t.estoque_item_id, t.created_at),
  ]
)

export const perda_estoque = pgTable(
  'perda_estoque',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    estoque_item_id: text('estoque_item_id')
      .notNull()
      .references(() => estoque_item.id, { onDelete: 'cascade' }),
    quantidade: numeric('quantidade', QUANTIDADE).notNull(),
    motivo: perdaMotivoEnum('motivo').notNull(),
    data: date('data').notNull(),
    responsavel: text('responsavel').notNull(),
    user_id: text('user_id').references(() => user.id),
    observacao: text('observacao'),
    created_at: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('perda_estoque_data_idx').on(t.data),
    index('perda_estoque_item_idx').on(t.estoque_item_id),
  ]
)

export const historico_preco_insumo = pgTable(
  'historico_preco_insumo',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    estoque_item_id: text('estoque_item_id')
      .notNull()
      .references(() => estoque_item.id, { onDelete: 'cascade' }),
    fornecedor_id: text('fornecedor_id').references(() => fornecedor.id),
    preco: numeric('preco', PRECO).notNull(),
    data_vigencia: date('data_vigencia').notNull(),
    created_at: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('historico_preco_insumo_item_vigencia_idx').on(
      t.estoque_item_id,
      t.data_vigencia
    ),
  ]
)

export const inventario_fisico = pgTable(
  'inventario_fisico',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    data: date('data').notNull(),
    responsavel: text('responsavel').notNull(),
    status: inventarioStatusEnum('status').notNull().default('em_andamento'),
    observacao: text('observacao'),
    created_at: timestamp('created_at').notNull().defaultNow(),
    finalizado_em: timestamp('finalizado_em'),
  },
  (t) => [index('inventario_fisico_data_idx').on(t.data)]
)

export const inventario_fisico_item = pgTable(
  'inventario_fisico_item',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    inventario_id: text('inventario_id')
      .notNull()
      .references(() => inventario_fisico.id, { onDelete: 'cascade' }),
    estoque_item_id: text('estoque_item_id')
      .notNull()
      .references(() => estoque_item.id, { onDelete: 'cascade' }),
    // congelado quando o inventário é aberto, para que a contagem não corra
    // atrás de um saldo que continua se movendo durante a conferência
    quantidade_sistema: numeric('quantidade_sistema', QUANTIDADE).notNull(),
    quantidade_contada: numeric('quantidade_contada', QUANTIDADE),
    diferenca: numeric('diferenca', QUANTIDADE),
  },
  (t) => [
    unique().on(t.inventario_id, t.estoque_item_id),
    index('inventario_fisico_item_inventario_idx').on(t.inventario_id),
  ]
)

export const fornecedorRelations = relations(fornecedor, ({ many }) => ({
  itensPadrao: many(estoque_item),
  precos: many(historico_preco_insumo),
}))

export const estoqueItemRelations = relations(
  estoque_item,
  ({ one, many }) => ({
    fornecedorPadrao: one(fornecedor, {
      fields: [estoque_item.fornecedor_padrao_id],
      references: [fornecedor.id],
    }),
    movimentos: many(estoque_movimento),
    perdas: many(perda_estoque),
    precos: many(historico_preco_insumo),
    linhasInventario: many(inventario_fisico_item),
  })
)

export const estoqueMovimentoRelations = relations(
  estoque_movimento,
  ({ one }) => ({
    item: one(estoque_item, {
      fields: [estoque_movimento.estoque_item_id],
      references: [estoque_item.id],
    }),
    usuario: one(user, {
      fields: [estoque_movimento.user_id],
      references: [user.id],
    }),
  })
)

export const perdaEstoqueRelations = relations(perda_estoque, ({ one }) => ({
  item: one(estoque_item, {
    fields: [perda_estoque.estoque_item_id],
    references: [estoque_item.id],
  }),
  usuario: one(user, {
    fields: [perda_estoque.user_id],
    references: [user.id],
  }),
}))

export const historicoPrecoInsumoRelations = relations(
  historico_preco_insumo,
  ({ one }) => ({
    item: one(estoque_item, {
      fields: [historico_preco_insumo.estoque_item_id],
      references: [estoque_item.id],
    }),
    fornecedor: one(fornecedor, {
      fields: [historico_preco_insumo.fornecedor_id],
      references: [fornecedor.id],
    }),
  })
)

export const inventarioFisicoRelations = relations(
  inventario_fisico,
  ({ many }) => ({
    linhas: many(inventario_fisico_item),
  })
)

export const inventarioFisicoItemRelations = relations(
  inventario_fisico_item,
  ({ one }) => ({
    inventario: one(inventario_fisico, {
      fields: [inventario_fisico_item.inventario_id],
      references: [inventario_fisico.id],
    }),
    item: one(estoque_item, {
      fields: [inventario_fisico_item.estoque_item_id],
      references: [estoque_item.id],
    }),
  })
)
