import { numeric, pgEnum, pgTable, text } from "drizzle-orm/pg-core"
import { createId } from "@paralleldrive/cuid2"

export const modeloContratualEnum = pgEnum("modelo_contratual", ["CLT", "MEI"])
export const entregadorStatusEnum = pgEnum("entregador_status", ["ativo", "inativo"])

export const entregador = pgTable("entregador", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  nome: text("nome").notNull(),
  salario: numeric("salario").notNull(),
  modelo_contratual: modeloContratualEnum("modelo_contratual").notNull(),
  status: entregadorStatusEnum("status").notNull().default("ativo"),
})
