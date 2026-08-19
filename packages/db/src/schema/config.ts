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

/**
 * Singleton — mesma ideia de `configuracaoComanda`. Só os dados do nosso
 * próprio estabelecimento (aparecem no cabeçalho da nota de fechamento do
 * dia) — café/suco/lanche não têm preço padrão global, são digitados na
 * hora, direto no drawer "Finalizar dia" de cada empresa.
 */
export const configuracaoResumoDia = pgTable('configuracao_resumo_dia', {
  id: text('id').primaryKey().default('default'),
  cnpj: text('cnpj'),
  inscricao_estadual: text('inscricao_estadual'),
  nome_estabelecimento: text('nome_estabelecimento'),
  endereco: text('endereco'),
  // URL de imagem já hospedada — sem upload de arquivo configurado ainda
  // (sem token do Vercel Blob), mesmo padrão de "cola o link" já usado em
  // outros lugares do app enquanto isso não existe.
  logo_url: text('logo_url'),
  cor_marca: text('cor_marca'),
  // Ordem/visibilidade das linhas do cabeçalho da nota de fechamento do dia
  // (nome, endereço, CNPJ+IE) — mesma ideia de `configuracaoComanda.campos`,
  // só que pro resumo do dia em vez da comanda.
  layout_campos: jsonb('layout_campos').$type<string[]>(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
})
