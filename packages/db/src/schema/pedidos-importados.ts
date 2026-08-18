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

import { empresa } from './empresa'

const PRECO = { precision: 12, scale: 2 } as const

export const turnoRefeicaoEnum = pgEnum('pedido_importado_turno', [
  'almoco',
  'jantar',
])

export const tamanhoMarmitaEnum = pgEnum('pedido_importado_tamanho', [
  'P',
  'M',
  'G',
])

/**
 * Ferramenta leve de importação de planilha (Google Forms), separada de
 * `funcionario`/`turno`/`cardapio`/`pedido` de propósito: aqueles exigem CPF
 * criptografado e vínculo via setor→turno, que a planilha não fornece. Este
 * domínio existe até o fluxo estruturado entrar em pauta — ver
 * docs/database-schema.md.
 */
export const colaborador_pedido = pgTable(
  'colaborador_pedido',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    empresa_id: text('empresa_id')
      .notNull()
      .references(() => empresa.id, { onDelete: 'cascade' }),
    nome: text('nome').notNull(),
    whatsapp: text('whatsapp'),
    // Nunca deletado — só marcado inativo se sumir de uma importação futura,
    // para preservar o histórico de pedidos já importados.
    ativo: boolean('ativo').notNull().default(true),
    created_at: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('colaborador_pedido_empresa_nome_idx').on(t.empresa_id, t.nome)]
)

/**
 * Um dia de calendário real por linha, não uma semana — é o que faz "o que
 * ele quer hoje" virar `WHERE data = hoje` direto, sem recalcular a data a
 * partir do texto "Semana do Cardápio" toda vez que a tela abre. Esse cálculo
 * acontece uma vez, na importação.
 */
export const pedido_dia_importado = pgTable(
  'pedido_dia_importado',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    colaborador_id: text('colaborador_id')
      .notNull()
      .references(() => colaborador_pedido.id, { onDelete: 'cascade' }),
    data: date('data').notNull(),
    turno: turnoRefeicaoEnum('turno'),
    tamanho: tamanhoMarmitaEnum('tamanho'),
    // Texto livre, exatamente como veio da planilha — este domínio não tenta
    // casar com um catálogo de cardápio estruturado.
    prato: text('prato'),
    observacao: text('observacao'),
    // Nome do arquivo importado — sem Vercel Blob (sem token configurado
    // ainda), mesmo padrão já usado em documento_anexo/arquivo_nota_fiscal.
    arquivo_origem: text('arquivo_origem'),
    // Carimbo de data/hora original da resposta no formulário — não é
    // quando importamos, é quando o funcionário respondeu.
    respondido_em: timestamp('respondido_em'),
    importado_em: timestamp('importado_em').notNull().defaultNow(),
  },
  (t) => [
    // Reimportar a mesma semana faz upsert por dia, não duplica.
    unique().on(t.colaborador_id, t.data),
    index('pedido_dia_importado_data_idx').on(t.data),
  ]
)

/**
 * Uma nota resumo por empresa/dia — snapshot no momento do fechamento, não
 * referência ao preço configurado hoje. Se o preço do lanche mudar amanhã,
 * o fechamento de ontem não pode mudar junto: por isso quantidade e preço
 * unitário de cada item vêm gravados aqui, não recalculados na leitura.
 */
export const fechamento_dia_empresa = pgTable(
  'fechamento_dia_empresa',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    empresa_id: text('empresa_id')
      .notNull()
      .references(() => empresa.id, { onDelete: 'cascade' }),
    data: date('data').notNull(),
    // P/M/G somados dos pedido_dia_importado reais daquele dia, no momento
    // do fechamento.
    quantidade_p: integer('quantidade_p').notNull().default(0),
    preco_unitario_p: numeric('preco_unitario_p', PRECO).notNull().default('0'),
    quantidade_m: integer('quantidade_m').notNull().default(0),
    preco_unitario_m: numeric('preco_unitario_m', PRECO).notNull().default('0'),
    quantidade_g: integer('quantidade_g').notNull().default(0),
    preco_unitario_g: numeric('preco_unitario_g', PRECO).notNull().default('0'),
    quantidade_cafe: integer('quantidade_cafe').notNull().default(0),
    preco_unitario_cafe: numeric('preco_unitario_cafe', PRECO).notNull().default('0'),
    quantidade_suco: integer('quantidade_suco').notNull().default(0),
    preco_unitario_suco: numeric('preco_unitario_suco', PRECO).notNull().default('0'),
    quantidade_lanche: integer('quantidade_lanche').notNull().default(0),
    preco_unitario_lanche: numeric('preco_unitario_lanche', PRECO).notNull().default('0'),
    finalizado_por: text('finalizado_por'),
    finalizado_em: timestamp('finalizado_em').notNull().defaultNow(),
  },
  (t) => [
    // Um fechamento por empresa/dia — evita finalizar o mesmo dia duas vezes
    // sem perceber.
    unique().on(t.empresa_id, t.data),
  ]
)

/**
 * Snapshot de cada marmita do fechamento — nome/prato/tamanho/preço gravados
 * na hora, sem FK para `colaborador_pedido`/`pedido_dia_importado`: essas
 * duas são limpas periodicamente após o fechamento, mas o histórico (e uma
 * eventual reimpressão) precisa continuar existindo independente disso.
 */
export const fechamento_dia_item = pgTable('fechamento_dia_item', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  fechamento_id: text('fechamento_id')
    .notNull()
    .references(() => fechamento_dia_empresa.id, { onDelete: 'cascade' }),
  colaborador_nome: text('colaborador_nome').notNull(),
  prato: text('prato'),
  tamanho: tamanhoMarmitaEnum('tamanho').notNull(),
  preco: numeric('preco', PRECO).notNull().default('0'),
})

export const colaboradorPedidoRelations = relations(
  colaborador_pedido,
  ({ one, many }) => ({
    empresa: one(empresa, {
      fields: [colaborador_pedido.empresa_id],
      references: [empresa.id],
    }),
    pedidos: many(pedido_dia_importado),
  })
)

export const pedidoDiaImportadoRelations = relations(
  pedido_dia_importado,
  ({ one }) => ({
    colaborador: one(colaborador_pedido, {
      fields: [pedido_dia_importado.colaborador_id],
      references: [colaborador_pedido.id],
    }),
  })
)

export const fechamentoDiaEmpresaRelations = relations(
  fechamento_dia_empresa,
  ({ many }) => ({
    itens: many(fechamento_dia_item),
  })
)

export const fechamentoDiaItemRelations = relations(
  fechamento_dia_item,
  ({ one }) => ({
    fechamento: one(fechamento_dia_empresa, {
      fields: [fechamento_dia_item.fechamento_id],
      references: [fechamento_dia_empresa.id],
    }),
  })
)
