import {
  boolean,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'

const PRECO = { precision: 12, scale: 2 } as const

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

/**
 * Singleton — mesma ideia de `configuracaoComanda`. Dados do nosso próprio
 * estabelecimento e preços dos itens avulsos (não vêm de planilha nenhuma)
 * que aparecem na nota de fechamento do dia.
 */
export const configuracaoResumoDia = pgTable('configuracao_resumo_dia', {
  id: text('id').primaryKey().default('default'),
  cnpj: text('cnpj'),
  nome_estabelecimento: text('nome_estabelecimento'),
  preco_cafe: numeric('preco_cafe', PRECO).notNull().default('0'),
  preco_suco: numeric('preco_suco', PRECO).notNull().default('0'),
  preco_lanche: numeric('preco_lanche', PRECO).notNull().default('0'),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
})
