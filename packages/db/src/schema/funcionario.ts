import { date, pgEnum, pgTable, text } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'
import { setor } from './turno'

export const vinculoStatusEnum = pgEnum('vinculo_status', ['ativo', 'inativo'])

export const funcionario = pgTable('funcionario', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  nome: text('nome').notNull(),
  cpf: text('cpf').notNull(), // ENCRYPTED — never store plaintext
  whatsapp: text('whatsapp'),
  restricao_alimentar: text('restricao_alimentar'),
})

export const funcionario_empresa = pgTable('funcionario_empresa', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  funcionario_id: text('funcionario_id')
    .notNull()
    .references(() => funcionario.id),
  setor_id: text('setor_id')
    .notNull()
    .references(() => setor.id),
  status: vinculoStatusEnum('status').notNull().default('ativo'),
  data_vinculo: date('data_vinculo').notNull(),
})
