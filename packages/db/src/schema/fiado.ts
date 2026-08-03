import { date, numeric, pgEnum, pgTable, text } from "drizzle-orm/pg-core"
import { createId } from "@paralleldrive/cuid2"

export const fiadoStatusEnum = pgEnum("fiado_status", ["pendente", "pago", "atrasado"])

export const fiado = pgTable("fiado", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  cliente_nome: text("cliente_nome").notNull(),
  valor: numeric("valor").notNull(),
  data_pedido: date("data_pedido").notNull(),
  data_vencimento: date("data_vencimento").notNull(),
  data_pagamento: date("data_pagamento"),
  status: fiadoStatusEnum("status").notNull().default("pendente"),
})
