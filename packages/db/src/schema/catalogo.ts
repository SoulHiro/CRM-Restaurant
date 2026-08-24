import { relations } from 'drizzle-orm'
import {
  boolean,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'

import { estoque_item } from './estoque'

const PRECO = { precision: 12, scale: 2 } as const
const QUANTIDADE = { precision: 12, scale: 3 } as const

export const tipoProdutoEnum = pgEnum('tipo_produto', ['comida', 'bebida'])

// 'personalizado': usa produto_disponibilidade_janela (dia/hora específicos)
// em vez dos toggles rápidos aparece_almoco/aparece_janta.
export const disponibilidadeStatusEnum = pgEnum('disponibilidade_status', [
  'disponivel',
  'pausado',
  'personalizado',
])

export const aplicaAEnum = pgEnum('classificacao_aplica_a', [
  'comida',
  'bebida',
  'ambos',
])

export const categoria_produto = pgTable('categoria_produto', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  nome: text('nome').notNull(),
  ordem: integer('ordem').notNull().default(0),
})

/**
 * O produto do catálogo (delivery/venda direta) — domínio distinto do
 * cardápio semanal das empresas-cliente (`cardapio-empresa.ts`), que é só
 * "prato do dia + alternativas", sem preço nem ficha técnica.
 *
 * `preco_minimo_sobrevivencia`/`preco_minimo_recomendado`/
 * `preco_maximo_recomendado` não são colunas — são sempre derivados na hora
 * a partir da ficha técnica + `configuracao_precificacao` (ver
 * features/catalogo/lib/precificacao-helpers.ts). Gravar um preço sugerido
 * congelaria um valor que o custo do insumo (que muda) deixaria de bater.
 * Só `preco_venda` (a decisão final do operador) é gravado de verdade.
 */
export const produto = pgTable('produto', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  nome: text('nome').notNull(),
  categoria_id: text('categoria_id').references(() => categoria_produto.id),
  tipo: tipoProdutoEnum('tipo').notNull().default('comida'),
  descricao: text('descricao'),
  foto_url: text('foto_url'),
  video_url: text('video_url'),
  disponivel_delivery: boolean('disponivel_delivery').notNull().default(true),
  disponivel_local: boolean('disponivel_local').notNull().default(true),
  disponibilidade_status: disponibilidadeStatusEnum('disponibilidade_status')
    .notNull()
    .default('disponivel'),
  // Toggle rápido — só usado quando disponibilidade_status !== 'personalizado'.
  // Referencia os horários de almoço/janta de configuracao_horario_funcionamento.
  aparece_almoco: boolean('aparece_almoco').notNull().default(true),
  aparece_janta: boolean('aparece_janta').notNull().default(true),
  tempo_medio_preparo_minutos: integer('tempo_medio_preparo_minutos'),
  preco_venda: numeric('preco_venda', PRECO),
  desconto_percentual: numeric('desconto_percentual', {
    precision: 5,
    scale: 2,
  }),
  ativo: boolean('ativo').notNull().default(true),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

/** Só existe linha aqui quando produto.disponibilidade_status = 'personalizado'. */
export const produto_disponibilidade_janela = pgTable(
  'produto_disponibilidade_janela',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    produto_id: text('produto_id')
      .notNull()
      .references(() => produto.id, { onDelete: 'cascade' }),
    // 0 = domingo ... 6 = sábado
    dia_semana: integer('dia_semana').notNull(),
    hora_inicio: text('hora_inicio').notNull(),
    hora_fim: text('hora_fim').notNull(),
  }
)

/** Ficha técnica — referencia o insumo real do Estoque, nunca texto livre. */
export const produto_ficha_tecnica_item = pgTable(
  'produto_ficha_tecnica_item',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    produto_id: text('produto_id')
      .notNull()
      .references(() => produto.id, { onDelete: 'cascade' }),
    estoque_item_id: text('estoque_item_id')
      .notNull()
      .references(() => estoque_item.id),
    quantidade: numeric('quantidade', QUANTIDADE).notNull(),
  },
  (t) => [unique().on(t.produto_id, t.estoque_item_id)]
)

export const adicional = pgTable('adicional', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  nome: text('nome').notNull(),
  preco: numeric('preco', PRECO).notNull().default('0'),
  ativo: boolean('ativo').notNull().default(true),
})

export const produto_adicional = pgTable(
  'produto_adicional',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    produto_id: text('produto_id')
      .notNull()
      .references(() => produto.id, { onDelete: 'cascade' }),
    adicional_id: text('adicional_id')
      .notNull()
      .references(() => adicional.id, { onDelete: 'cascade' }),
  },
  (t) => [unique().on(t.produto_id, t.adicional_id)]
)

// Ex: "Vegetariano", "Vegano", "Orgânico", "Sem glúten", "Sem açúcar",
// "Zero lactose" (comida); "Diet/Zero", "Gelada", "Alcoólica", "Natural"
// (bebida) — cadastro livre em vez de enum fixo, pra não precisar de
// migration toda vez que surgir uma classificação nova.
export const classificacao = pgTable('classificacao', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  nome: text('nome').notNull(),
  aplica_a: aplicaAEnum('aplica_a').notNull().default('ambos'),
})

export const produto_classificacao = pgTable(
  'produto_classificacao',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    produto_id: text('produto_id')
      .notNull()
      .references(() => produto.id, { onDelete: 'cascade' }),
    classificacao_id: text('classificacao_id')
      .notNull()
      .references(() => classificacao.id, { onDelete: 'cascade' }),
  },
  (t) => [unique().on(t.produto_id, t.classificacao_id)]
)

export const produtoRelations = relations(produto, ({ one, many }) => ({
  categoria: one(categoria_produto, {
    fields: [produto.categoria_id],
    references: [categoria_produto.id],
  }),
  fichaTecnica: many(produto_ficha_tecnica_item),
  janelasDisponibilidade: many(produto_disponibilidade_janela),
  adicionais: many(produto_adicional),
  classificacoes: many(produto_classificacao),
}))

export const produtoFichaTecnicaItemRelations = relations(
  produto_ficha_tecnica_item,
  ({ one }) => ({
    produto: one(produto, {
      fields: [produto_ficha_tecnica_item.produto_id],
      references: [produto.id],
    }),
    insumo: one(estoque_item, {
      fields: [produto_ficha_tecnica_item.estoque_item_id],
      references: [estoque_item.id],
    }),
  })
)

export const produtoDisponibilidadeJanelaRelations = relations(
  produto_disponibilidade_janela,
  ({ one }) => ({
    produto: one(produto, {
      fields: [produto_disponibilidade_janela.produto_id],
      references: [produto.id],
    }),
  })
)

export const produtoAdicionalRelations = relations(
  produto_adicional,
  ({ one }) => ({
    produto: one(produto, {
      fields: [produto_adicional.produto_id],
      references: [produto.id],
    }),
    adicional: one(adicional, {
      fields: [produto_adicional.adicional_id],
      references: [adicional.id],
    }),
  })
)

export const produtoClassificacaoRelations = relations(
  produto_classificacao,
  ({ one }) => ({
    produto: one(produto, {
      fields: [produto_classificacao.produto_id],
      references: [produto.id],
    }),
    classificacao: one(classificacao, {
      fields: [produto_classificacao.classificacao_id],
      references: [classificacao.id],
    }),
  })
)

export const categoriaProdutoRelations = relations(
  categoria_produto,
  ({ many }) => ({
    produtos: many(produto),
  })
)
