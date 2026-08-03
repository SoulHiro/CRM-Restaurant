import { boolean, date, numeric, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { createId } from "@paralleldrive/cuid2"

export const empresaStatusEnum = pgEnum("empresa_status", ["ativo", "inativo"])

export const empresa = pgTable("empresa", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  nome: text("nome").notNull(),
  endereco: text("endereco"),
  zona: text("zona"),
  email_contato: text("email_contato"),
  telefone_contato: text("telefone_contato"),
  status: empresaStatusEnum("status").notNull().default("ativo"),
  created_at: timestamp("created_at").notNull().defaultNow(),
})

export const empresa_contrato = pgTable("empresa_contrato", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  empresa_id: text("empresa_id").notNull().references(() => empresa.id),
  arquivo_url: text("arquivo_url"),
  valor: numeric("valor"),
  vigencia_inicio: date("vigencia_inicio"),
  vigencia_fim: date("vigencia_fim"),
  prazo_pagamento: text("prazo_pagamento"),
  vigente: boolean("vigente").notNull().default(false),
  uploaded_at: timestamp("uploaded_at").notNull().defaultNow(),
})

export const empresa_pausa_dia = pgTable("empresa_pausa_dia", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  empresa_id: text("empresa_id").notNull().references(() => empresa.id),
  data: date("data").notNull(),
  motivo: text("motivo"),
})
