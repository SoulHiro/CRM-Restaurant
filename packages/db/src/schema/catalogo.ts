import { relations } from 'drizzle-orm'
import {
  boolean,
  date,
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
  // Pausa é sempre "por hoje" — nunca permanente. `null` = nunca pausado;
  // igual a hoje = pausado agora; qualquer data passada é lida como "não
  // pausado mais" na hora de exibir (sem job pra limpar, só comparação em
  // queries.ts — mesmo princípio de nivelEstoque/diasAteVencer no estoque).
  pausado_em: date('pausado_em'),
  // Referencia os horários de almoço/janta de configuracao_horario_funcionamento.
  aparece_almoco: boolean('aparece_almoco').notNull().default(true),
  aparece_janta: boolean('aparece_janta').notNull().default(true),
  // Chaves fixas de features/catalogo/lib/classificacoes.ts (vegano, sem
  // glúten, gelada...) — não é entidade de banco, é rótulo fixo por tipo de
  // produto, então vive como array na própria linha, sem tabela de apoio.
  classificacoes: text('classificacoes').array(),
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

/**
 * Em quais dias da semana o produto normalmente entra no cardápio (ex:
 * feijoada = quarta e sábado). Sem linha nenhuma = todo dia. Sem hora —
 * hora vem de aparece_almoco/aparece_janta + horário de funcionamento
 * (configuração ainda não existe, fica pra depois).
 */
export const produto_dia_semana = pgTable(
  'produto_dia_semana',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    produto_id: text('produto_id')
      .notNull()
      .references(() => produto.id, { onDelete: 'cascade' }),
    // 0 = domingo ... 6 = sábado
    dia_semana: integer('dia_semana').notNull(),
  },
  (t) => [unique().on(t.produto_id, t.dia_semana)]
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

/**
 * Grupo reutilizável de adicionais (ex: "Molhos", "Bacon e queijos") —
 * cadastrado em /catalogo/adicionais, escolhido por um ou mais produtos.
 * Disponibilidade por turno aqui, não por item: um item dentro de um grupo
 * de almoço não existe fora do almoço.
 */
export const grupo_adicional = pgTable('grupo_adicional', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  nome: text('nome').notNull(),
  disponivel_almoco: boolean('disponivel_almoco').notNull().default(true),
  disponivel_janta: boolean('disponivel_janta').notNull().default(true),
  ativo: boolean('ativo').notNull().default(true),
  created_at: timestamp('created_at').notNull().defaultNow(),
})

export const adicional = pgTable('adicional', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  grupo_id: text('grupo_id')
    .notNull()
    .references(() => grupo_adicional.id, { onDelete: 'cascade' }),
  nome: text('nome').notNull(),
  preco: numeric('preco', PRECO).notNull().default('0'),
  foto_url: text('foto_url'),
  // Quantidade máxima/mínima é por item, não por grupo — ex: "Bacon extra,
  // até 3 unidades".
  quantidade_minima: integer('quantidade_minima').notNull().default(0),
  quantidade_maxima: integer('quantidade_maxima').notNull().default(1),
  ativo: boolean('ativo').notNull().default(true),
})

export const produto_grupo_adicional = pgTable(
  'produto_grupo_adicional',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    produto_id: text('produto_id')
      .notNull()
      .references(() => produto.id, { onDelete: 'cascade' }),
    grupo_id: text('grupo_id')
      .notNull()
      .references(() => grupo_adicional.id, { onDelete: 'cascade' }),
  },
  (t) => [unique().on(t.produto_id, t.grupo_id)]
)

export const produtoRelations = relations(produto, ({ one, many }) => ({
  categoria: one(categoria_produto, {
    fields: [produto.categoria_id],
    references: [categoria_produto.id],
  }),
  fichaTecnica: many(produto_ficha_tecnica_item),
  diasSemana: many(produto_dia_semana),
  grupoAdicionais: many(produto_grupo_adicional),
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

export const produtoDiaSemanaRelations = relations(
  produto_dia_semana,
  ({ one }) => ({
    produto: one(produto, {
      fields: [produto_dia_semana.produto_id],
      references: [produto.id],
    }),
  })
)

export const grupoAdicionalRelations = relations(
  grupo_adicional,
  ({ many }) => ({
    itens: many(adicional),
    produtos: many(produto_grupo_adicional),
  })
)

export const adicionalRelations = relations(adicional, ({ one }) => ({
  grupo: one(grupo_adicional, {
    fields: [adicional.grupo_id],
    references: [grupo_adicional.id],
  }),
}))

export const produtoGrupoAdicionalRelations = relations(
  produto_grupo_adicional,
  ({ one }) => ({
    produto: one(produto, {
      fields: [produto_grupo_adicional.produto_id],
      references: [produto.id],
    }),
    grupo: one(grupo_adicional, {
      fields: [produto_grupo_adicional.grupo_id],
      references: [grupo_adicional.id],
    }),
  })
)

export const categoriaProdutoRelations = relations(
  categoria_produto,
  ({ many }) => ({
    produtos: many(produto),
  })
)
