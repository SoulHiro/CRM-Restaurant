import { boolean, date, integer, numeric, pgEnum, pgTable, text, unique } from "drizzle-orm/pg-core"
import { createId } from "@paralleldrive/cuid2"

export const origemEnum = pgEnum("origem", ["manual", "automatico"])

export const canal = pgTable("canal", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  nome: text("nome").notNull(),
  ativo: boolean("ativo").notNull().default(true),
})

export const registro_canal_dia = pgTable("registro_canal_dia", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  canal_id: text("canal_id").notNull().references(() => canal.id),
  data: date("data").notNull(),
  quantidade: integer("quantidade").notNull(),
  valor: numeric("valor").notNull(),
  origem: origemEnum("origem").notNull(),
}, (t) => [unique().on(t.canal_id, t.data)])
