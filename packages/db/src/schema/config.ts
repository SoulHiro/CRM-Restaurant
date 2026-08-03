import { boolean, pgEnum, pgTable, text } from "drizzle-orm/pg-core"
import { createId } from "@paralleldrive/cuid2"

export const impressoraTipoEnum = pgEnum("impressora_tipo", ["comanda", "etiqueta"])

export const impressora = pgTable("impressora", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  nome: text("nome").notNull(),
  tipo: impressoraTipoEnum("tipo").notNull(),
  identificador_qz: text("identificador_qz").notNull(),
  ativo: boolean("ativo").notNull().default(true),
})
