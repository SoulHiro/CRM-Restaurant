import { relations } from 'drizzle-orm'
import {
  boolean,
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

import { organization, user } from './auth'
import { produto, produto_tamanho } from './catalogo'

export const comandaStatusEnum = pgEnum('comanda_status', [
  'aberta',
  'fechada',
  'cancelada',
])

export const formaPagamentoEnum = pgEnum('forma_pagamento', [
  'credito',
  'debito',
  'pix',
  'dinheiro',
])

const QUANTIDADE = { precision: 12, scale: 3 } as const

/**
 * Singleton por organização — quantas comandas físicas numeradas o
 * restaurante tem (a Diniz Gourmet reaproveita as mesmas 200 peças o dia
 * inteiro). Alimenta o tamanho da grade em /mesas.
 */
export const configuracao_salao = pgTable(
  'configuracao_salao',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    organization_id: text('organization_id')
      .notNull()
      .references(() => organization.id),
    quantidade_comandas: integer('quantidade_comandas').notNull().default(200),
    updated_at: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [unique().on(t.organization_id)]
)

/**
 * Não existe cadastro de "mesa" — o restaurante já opera com comandas
 * físicas numeradas, reaproveitadas o dia inteiro (número 47 pode abrir e
 * fechar 15 vezes na mesma noite). Por isso `numero` NÃO tem
 * `unique(organization_id, numero)` aqui: a unicidade real ("não pode
 * haver duas comandas abertas com o mesmo número ao mesmo tempo") é um
 * índice único parcial (`where status = 'aberta'`) criado via SQL cru na
 * migração — `unique()` do table builder do Drizzle não expõe `WHERE`.
 */
export const comanda = pgTable(
  'comanda',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    organization_id: text('organization_id')
      .notNull()
      .references(() => organization.id),
    numero: integer('numero').notNull(),
    // Dia de competência (não created_at) — só para relatório.
    data: date('data').notNull(),
    // Referência livre de onde o cliente está ("Mesa 12", "2º andar") —
    // sem cadastro nem validação, é só anotação do garçom.
    mesa_label: text('mesa_label'),
    status: comandaStatusEnum('status').notNull().default('aberta'),
    aberto_por_user_id: text('aberto_por_user_id')
      .notNull()
      .references(() => user.id),
    aberto_em: timestamp('aberto_em').notNull().defaultNow(),
    fechado_em: timestamp('fechado_em'),
    nota_pendente: boolean('nota_pendente').notNull().default(false),
    cliente_email: text('cliente_email'),
    observacao: text('observacao'),
  },
  (t) => [
    index('comanda_organization_status_idx').on(t.organization_id, t.status),
    index('comanda_organization_data_idx').on(t.organization_id, t.data),
  ]
)

/**
 * `preco_unitario_centavos` é snapshot no momento do lançamento — um
 * reajuste de preço do produto depois não pode corromper o valor de uma
 * comanda já aberta. Centavos como inteiro (não `numeric`) porque
 * pagamento parcial/troco/divisão de conta precisam de exatidão total —
 * único ponto do projeto que faz essa conta em inteiro, ver
 * `features/mesas/lib/dinheiro.ts`.
 */
export const comanda_item = pgTable(
  'comanda_item',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    comanda_id: text('comanda_id')
      .notNull()
      .references(() => comanda.id, { onDelete: 'cascade' }),
    produto_id: text('produto_id')
      .notNull()
      .references(() => produto.id),
    produto_tamanho_id: text('produto_tamanho_id').references(
      () => produto_tamanho.id
    ),
    quantidade: numeric('quantidade', QUANTIDADE).notNull(),
    preco_unitario_centavos: integer('preco_unitario_centavos').notNull(),
    observacao: text('observacao'),
    // null = ainda não impresso na cozinha. "Enviar pra cozinha" imprime só
    // os itens com esse campo nulo e depois marca todos de uma vez.
    enviado_cozinha_em: timestamp('enviado_cozinha_em'),
    excluido: boolean('excluido').notNull().default(false),
    excluido_em: timestamp('excluido_em'),
    criado_por_user_id: text('criado_por_user_id')
      .notNull()
      .references(() => user.id),
    criado_em: timestamp('criado_em').notNull().defaultNow(),
  },
  (t) => [
    index('comanda_item_comanda_idx').on(t.comanda_id),
    index('comanda_item_cozinha_pendente_idx').on(
      t.comanda_id,
      t.enviado_cozinha_em
    ),
  ]
)

/**
 * Uma linha por forma de pagamento aplicada — cobre pagamento integral (1
 * linha), misto (N linhas, formas diferentes) e divisão de conta (N linhas
 * de valor igual) com o mesmo modelo. Troco nunca é gravado aqui: é
 * derivado na hora (valor recebido em dinheiro menos saldo devido), mesmo
 * princípio de "estado que muda não se grava" do resto do projeto.
 */
export const comanda_pagamento = pgTable(
  'comanda_pagamento',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    comanda_id: text('comanda_id')
      .notNull()
      .references(() => comanda.id, { onDelete: 'cascade' }),
    forma: formaPagamentoEnum('forma').notNull(),
    valor_centavos: integer('valor_centavos').notNull(),
    criado_por_user_id: text('criado_por_user_id')
      .notNull()
      .references(() => user.id),
    criado_em: timestamp('criado_em').notNull().defaultNow(),
  },
  (t) => [index('comanda_pagamento_comanda_idx').on(t.comanda_id)]
)

export const comandaRelations = relations(comanda, ({ one, many }) => ({
  abertoPor: one(user, {
    fields: [comanda.aberto_por_user_id],
    references: [user.id],
  }),
  itens: many(comanda_item),
  pagamentos: many(comanda_pagamento),
}))

export const comandaItemRelations = relations(comanda_item, ({ one }) => ({
  comanda: one(comanda, {
    fields: [comanda_item.comanda_id],
    references: [comanda.id],
  }),
  produto: one(produto, {
    fields: [comanda_item.produto_id],
    references: [produto.id],
  }),
  tamanho: one(produto_tamanho, {
    fields: [comanda_item.produto_tamanho_id],
    references: [produto_tamanho.id],
  }),
}))

export const comandaPagamentoRelations = relations(
  comanda_pagamento,
  ({ one }) => ({
    comanda: one(comanda, {
      fields: [comanda_pagamento.comanda_id],
      references: [comanda.id],
    }),
  })
)
