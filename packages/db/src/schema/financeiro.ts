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
} from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'

import { user } from './auth'
import { empresa } from './empresa'

export const transacaoTipoEnum = pgEnum('transacao_tipo', ['receita', 'despesa'])

export const transacaoOrigemEnum = pgEnum('transacao_origem', [
  'anotai',
  'ifood',
  'pagbank',
  'marmita_b2b',
  'manual',
])

export const despesaCategoriaEnum = pgEnum('despesa_categoria', [
  'fixa',
  'variavel',
])

export const despesaSubtipoEnum = pgEnum('despesa_subtipo', [
  'aluguel',
  'salario',
  'vale_transporte',
  'imposto',
  'fornecedor',
  'insumo',
  'equipamento',
  'manutencao',
  'taxa_plataforma',
  'outro',
])

// "atrasado" não é guardado: é derivado de `pendente && vencimento < hoje`.
// Guardar as três exigiria um job para virar pendente→atrasado e, sem ele
// rodando, o dado mentiria — mesmo princípio dos alertas de estoque.
export const contaStatusEnum = pgEnum('conta_status', ['pendente', 'pago'])

export const metaTipoEnum = pgEnum('meta_tipo', ['financeira', 'operacional'])

export const progressoOrigemEnum = pgEnum('progresso_origem', [
  'dre_automatico',
  'ajuste_manual',
])

const DINHEIRO = { precision: 12, scale: 2 } as const

/**
 * Livro-razão do dinheiro e fonte ÚNICA do DRE — para o financeiro o que
 * `estoque_movimento` é para o estoque. Conta a pagar/receber é previsão e
 * nunca entra no DRE direto: só vira linha aqui quando marcada como paga.
 * É isso que impede contagem dupla.
 */
export const transacao_financeira = pgTable(
  'transacao_financeira',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    tipo: transacaoTipoEnum('tipo').notNull(),
    origem: transacaoOrigemEnum('origem').notNull().default('manual'),
    // Sempre positivo — o sinal vem de `tipo`, como em contabilidade.
    valor: numeric('valor', DINHEIRO).notNull(),
    data: date('data').notNull(),
    descricao: text('descricao').notNull(),
    categoria: despesaCategoriaEnum('categoria'),
    subtipo: despesaSubtipoEnum('subtipo'),
    origem_tipo: text('origem_tipo'),
    origem_id: text('origem_id'),
    referencia_externa: text('referencia_externa'),
    sincronizado_em: timestamp('sincronizado_em'),
    user_id: text('user_id').references(() => user.id),
    created_at: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('transacao_financeira_data_idx').on(t.data),
    index('transacao_financeira_tipo_data_idx').on(t.tipo, t.data),
    index('transacao_financeira_origem_idx').on(t.origem),
    index('transacao_financeira_origem_ref_idx').on(t.origem_tipo, t.origem_id),
  ]
)

export const conta_a_pagar = pgTable(
  'conta_a_pagar',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    descricao: text('descricao').notNull(),
    categoria: despesaCategoriaEnum('categoria').notNull(),
    subtipo: despesaSubtipoEnum('subtipo').notNull(),
    valor: numeric('valor', DINHEIRO).notNull(),
    data_vencimento: date('data_vencimento').notNull(),
    status: contaStatusEnum('status').notNull().default('pendente'),
    data_pagamento: date('data_pagamento'),
    observacao: text('observacao'),
    // Quem gerou esta conta — hoje `compra`, amanhã salário/benefício (Fase 3).
    // Mesmo par de colunas que `transacao_financeira` usa.
    origem_tipo: text('origem_tipo'),
    origem_id: text('origem_id'),
    user_id: text('user_id').references(() => user.id),
    created_at: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('conta_a_pagar_status_venc_idx').on(t.status, t.data_vencimento),
    index('conta_a_pagar_venc_idx').on(t.data_vencimento),
    index('conta_a_pagar_origem_idx').on(t.origem_tipo, t.origem_id),
  ]
)

/**
 * `empresa_id` é nullable e `empresa_nome` é obrigatório — mesmo padrão que
 * `fiado` usa com cliente. A tabela `empresa` está vazia e a feature de
 * empresas ainda é mock; assim dá para cobrar hoje digitando o nome, e ligar
 * ao cadastro real depois sem migração dolorosa.
 */
export const conta_a_receber_b2b = pgTable(
  'conta_a_receber_b2b',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    empresa_id: text('empresa_id').references(() => empresa.id),
    empresa_nome: text('empresa_nome').notNull(),
    periodo: text('periodo').notNull(),
    valor: numeric('valor', DINHEIRO).notNull(),
    data_vencimento: date('data_vencimento').notNull(),
    status: contaStatusEnum('status').notNull().default('pendente'),
    data_pagamento: date('data_pagamento'),
    observacao: text('observacao'),
    user_id: text('user_id').references(() => user.id),
    created_at: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('conta_a_receber_status_venc_idx').on(t.status, t.data_vencimento),
    index('conta_a_receber_empresa_idx').on(t.empresa_id),
  ]
)

export const meta = pgTable(
  'meta',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    descricao: text('descricao').notNull(),
    tipo: metaTipoEnum('tipo').notNull(),
    valor_alvo: numeric('valor_alvo', DINHEIRO),
    // `inicio` não está no doc original, mas somar "o lucro desde o começo do
    // período" exige uma data de partida.
    inicio: date('inicio').notNull(),
    prazo: date('prazo').notNull(),
    ativa: boolean('ativa').notNull().default(true),
    created_at: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('meta_ativa_idx').on(t.ativa)]
)

/**
 * Guarda só o que o DRE não enxerga (aporte pessoal, retirada emergencial).
 * O progresso automático é calculado ao vivo somando o lucro do período, então
 * `valor` aqui é um DELTA (+/−), não um total acumulado. O enum `origem`
 * mantém `dre_automatico` para quando existir um job de snapshot.
 */
export const progresso_meta = pgTable(
  'progresso_meta',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    meta_id: text('meta_id')
      .notNull()
      .references(() => meta.id, { onDelete: 'cascade' }),
    data: date('data').notNull(),
    valor: numeric('valor', DINHEIRO).notNull(),
    origem: progressoOrigemEnum('origem').notNull().default('ajuste_manual'),
    observacao: text('observacao'),
    user_id: text('user_id').references(() => user.id),
    created_at: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('progresso_meta_meta_idx').on(t.meta_id, t.data)]
)

export const transacaoFinanceiraRelations = relations(
  transacao_financeira,
  ({ one }) => ({
    usuario: one(user, {
      fields: [transacao_financeira.user_id],
      references: [user.id],
    }),
  })
)

export const contaAPagarRelations = relations(conta_a_pagar, ({ one }) => ({
  usuario: one(user, {
    fields: [conta_a_pagar.user_id],
    references: [user.id],
  }),
}))

export const contaAReceberB2bRelations = relations(
  conta_a_receber_b2b,
  ({ one }) => ({
    empresa: one(empresa, {
      fields: [conta_a_receber_b2b.empresa_id],
      references: [empresa.id],
    }),
    usuario: one(user, {
      fields: [conta_a_receber_b2b.user_id],
      references: [user.id],
    }),
  })
)

export const metaRelations = relations(meta, ({ many }) => ({
  progressos: many(progresso_meta),
}))

export const progressoMetaRelations = relations(progresso_meta, ({ one }) => ({
  meta: one(meta, {
    fields: [progresso_meta.meta_id],
    references: [meta.id],
  }),
  usuario: one(user, {
    fields: [progresso_meta.user_id],
    references: [user.id],
  }),
}))
