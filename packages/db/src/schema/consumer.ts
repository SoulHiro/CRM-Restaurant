import { date, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { createId } from "@paralleldrive/cuid2"
import { empresa } from "./empresa"

export const envioStatusEnum = pgEnum("envio_status", ["enviado", "confirmado", "erro"])

export const envio_consumer = pgTable("envio_consumer", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  empresa_id: text("empresa_id").notNull().references(() => empresa.id),
  data: date("data").notNull(),
  status: envioStatusEnum("status").notNull(),
  nota_fiscal_numero: text("nota_fiscal_numero"),
  nota_fiscal_chave_acesso: text("nota_fiscal_chave_acesso"),
  nota_fiscal_emitida_em: timestamp("nota_fiscal_emitida_em"),
  created_at: timestamp("created_at").notNull().defaultNow(),
})
