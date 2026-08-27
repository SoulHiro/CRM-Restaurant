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
} from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'

import { user } from './auth'
import { produto } from './catalogo'
import { funcionario_interno } from './rh'

// Mesmo par que `conta_a_pagar`/`conta_a_receber_b2b` já usam — sem
// desconto automático em folha por enquanto: "pago" só marca que a casa
// decidiu como aquilo foi resolvido (advertência, desconto manual, etc.),
// não que dinheiro necessariamente trocou de mão.
export const consumoFuncionarioStatusEnum = pgEnum(
  'consumo_funcionario_status',
  ['pendente', 'pago']
)

const DINHEIRO = { precision: 12, scale: 2 } as const

/**
 * Um funcionário consumindo um produto do cardápio sem venda registrada
 * (doce, bebida, sobremesa) — não é `estoque_movimento` porque o que
 * importa aqui é o valor devido pela pessoa, não a baixa de insumo; o
 * produto consumido já tem preço de venda próprio, então não duplicamos
 * ficha técnica nem custo aqui. `preco_unitario` é congelado no momento do
 * lançamento — se o preço do produto mudar depois, o histórico não mente.
 */
export const consumo_funcionario = pgTable(
  'consumo_funcionario',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    funcionario_interno_id: text('funcionario_interno_id')
      .notNull()
      .references(() => funcionario_interno.id, { onDelete: 'cascade' }),
    produto_id: text('produto_id')
      .notNull()
      .references(() => produto.id),
    quantidade: integer('quantidade').notNull().default(1),
    preco_unitario: numeric('preco_unitario', DINHEIRO).notNull(),
    status: consumoFuncionarioStatusEnum('status').notNull().default('pendente'),
    data_pagamento: date('data_pagamento'),
    user_id: text('user_id').references(() => user.id),
    created_at: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('consumo_funcionario_status_idx').on(
      t.funcionario_interno_id,
      t.status
    ),
  ]
)

export const consumoFuncionarioRelations = relations(
  consumo_funcionario,
  ({ one }) => ({
    funcionario: one(funcionario_interno, {
      fields: [consumo_funcionario.funcionario_interno_id],
      references: [funcionario_interno.id],
    }),
    produto: one(produto, {
      fields: [consumo_funcionario.produto_id],
      references: [produto.id],
    }),
    usuario: one(user, {
      fields: [consumo_funcionario.user_id],
      references: [user.id],
    }),
  })
)
