import { json, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { createId } from "@paralleldrive/cuid2"

export const audit_log = pgTable("audit_log", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  user_id: text("user_id"), // nullable FK to Better Auth user table
  ator_descricao: text("ator_descricao"),
  acao: text("acao").notNull(),
  detalhes: json("detalhes"),
  created_at: timestamp("created_at").notNull().defaultNow(),
})
