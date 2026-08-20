import {
  boolean,
  date,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'

export const empresaStatusEnum = pgEnum('empresa_status', ['ativo', 'inativo'])

// 'pesagem': parte dos pedidos do dia não vira comanda individual — é
// preparada em lote (arroz/feijão calculados por headcount, resto contado
// por prato) e impressa num papel de conferência à parte. Hoje só a
// NOVAPRINT2 usa isso; ver features/empresas/lib/pesagem-helpers.ts.
export const empresaFluxoPedidoEnum = pgEnum('empresa_fluxo_pedido', [
  'padrao',
  'pesagem',
])

// 'unico': a empresa não distingue P/M/G — todo mundo paga o mesmo valor por
// marmita (ex: COFEL, R$26 fixo). Troca os 3 campos de preço por 1 só em
// Valores/Finalizar dia, e a comanda não imprime linha de tamanho.
export const empresaPrecoModoEnum = pgEnum('empresa_preco_modo', [
  'por_tamanho',
  'unico',
])

export const empresa = pgTable('empresa', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  nome: text('nome').notNull(),
  cnpj: text('cnpj').notNull().unique(),
  responsavel_nome: text('responsavel_nome'),
  email_contato: text('email_contato'),
  telefone_contato: text('telefone_contato'),
  cep: text('cep'),
  logradouro: text('logradouro'),
  numero: text('numero'),
  complemento: text('complemento'),
  bairro: text('bairro'),
  cidade: text('cidade'),
  uf: text('uf'),
  status: empresaStatusEnum('status').notNull().default('ativo'),
  fluxo_pedido: empresaFluxoPedidoEnum('fluxo_pedido').notNull().default('padrao'),
  // Independente de fluxo_pedido — CANÚBIO é fluxo padrão mas também não usa
  // P/M/G/Lanche/Café/Suco no resumo do dia (só marmita simples, sem esses
  // conceitos). GPK/LNR continuam com o bloco de quantidades normal.
  resumo_mostra_quantidades: boolean('resumo_mostra_quantidades')
    .notNull()
    .default(true),
  preco_modo: empresaPrecoModoEnum('preco_modo').notNull().default('por_tamanho'),
  // Ligados por padrão (comportamento de hoje) — desliga por empresa quando
  // ela nunca pede aquele item, pra sumir o campo de Finalizar dia/Valores e
  // o bloco correspondente no resumo do dia, em vez de mostrar zerado.
  pede_cafe: boolean('pede_cafe').notNull().default(true),
  pede_lanche: boolean('pede_lanche').notNull().default(true),
  pede_suco: boolean('pede_suco').notNull().default(true),
  created_at: timestamp('created_at').notNull().defaultNow(),
})

export const empresa_contrato = pgTable('empresa_contrato', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  empresa_id: text('empresa_id')
    .notNull()
    .references(() => empresa.id),
  arquivo_url: text('arquivo_url'),
  valor: numeric('valor'),
  vigencia_inicio: date('vigencia_inicio'),
  vigencia_fim: date('vigencia_fim'),
  prazo_pagamento: text('prazo_pagamento'),
  vigente: boolean('vigente').notNull().default(false),
  uploaded_at: timestamp('uploaded_at').notNull().defaultNow(),
})

export const empresa_pausa_dia = pgTable('empresa_pausa_dia', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  empresa_id: text('empresa_id')
    .notNull()
    .references(() => empresa.id),
  data: date('data').notNull(),
  motivo: text('motivo'),
})
