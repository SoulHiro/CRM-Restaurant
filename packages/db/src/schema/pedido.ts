import { pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'
import { funcionario_empresa } from './funcionario'
import { cardapio_dia, item_adicional, tamanhoEnum } from './cardapio'
import { envio_consumer } from './consumer'

export const statusImpressaoEnum = pgEnum('status_impressao', [
  'pendente',
  'impresso',
  'erro_impressao',
])

export const pedido = pgTable('pedido', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  funcionario_empresa_id: text('funcionario_empresa_id')
    .notNull()
    .references(() => funcionario_empresa.id),
  cardapio_dia_id: text('cardapio_dia_id')
    .notNull()
    .references(() => cardapio_dia.id),
  tamanho: tamanhoEnum('tamanho').notNull(),
  status_impressao: statusImpressaoEnum('status_impressao')
    .notNull()
    .default('pendente'),
  motivo_erro: text('motivo_erro'),
  envio_consumer_id: text('envio_consumer_id').references(
    () => envio_consumer.id
  ),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
})

export const pedido_item_adicional = pgTable('pedido_item_adicional', {
  pedido_id: text('pedido_id')
    .notNull()
    .references(() => pedido.id),
  item_adicional_id: text('item_adicional_id')
    .notNull()
    .references(() => item_adicional.id),
})
