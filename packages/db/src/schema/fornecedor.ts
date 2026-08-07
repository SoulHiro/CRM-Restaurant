import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'

export const fornecedor = pgTable('fornecedor', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  nome: text('nome').notNull(),
  contato: text('contato'),
  prazo_entrega_dias: integer('prazo_entrega_dias'),
  prazo_pagamento: text('prazo_pagamento'),
  created_at: timestamp('created_at').notNull().defaultNow(),
})
