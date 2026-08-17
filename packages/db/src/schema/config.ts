import { boolean, jsonb, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'

export const impressoraTipoEnum = pgEnum('impressora_tipo', [
  'comanda',
  'etiqueta',
])

export const impressora = pgTable('impressora', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  nome: text('nome').notNull(),
  tipo: impressoraTipoEnum('tipo').notNull(),
  identificador_qz: text('identificador_qz').notNull(),
  ativo: boolean('ativo').notNull().default(true),
})

/**
 * Singleton — sempre uma linha só, id fixo (não CUID). Um único layout de
 * comanda vale pro restaurante inteiro; não há tela nem necessidade de
 * layout por empresa hoje.
 */
export const configuracaoComanda = pgTable('configuracao_comanda', {
  id: text('id').primaryKey().default('default'),
  // Chaves dos campos opcionais, na ordem em que aparecem na comanda —
  // um campo ausente da lista é um campo escondido. O nome do colaborador
  // não entra aqui: é sempre o topo fixo da comanda.
  campos: jsonb('campos').$type<string[]>().notNull(),
  // Qual `impressora` (tipo comanda) recebe os pedidos — nullable: sem
  // escolha ainda, cai no fallback de "primeira comanda ativa".
  impressora_id: text('impressora_id').references(() => impressora.id, {
    onDelete: 'set null',
  }),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
})
