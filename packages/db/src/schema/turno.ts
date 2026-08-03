import { pgEnum, pgTable, text, time } from "drizzle-orm/pg-core"
import { createId } from "@paralleldrive/cuid2"
import { empresa } from "./empresa"

export const refeicaoGeradaEnum = pgEnum("refeicao_gerada", ["almoco", "janta"])

export const turno = pgTable("turno", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  empresa_id: text("empresa_id").notNull().references(() => empresa.id),
  nome: text("nome").notNull(),
  horario_inicio: time("horario_inicio").notNull(),
  horario_fim: time("horario_fim").notNull(),
  refeicao_gerada: refeicaoGeradaEnum("refeicao_gerada").notNull(),
  modalidade: text("modalidade"),
  forms_link_slug: text("forms_link_slug").unique(),
})

export const setor = pgTable("setor", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  turno_id: text("turno_id").notNull().references(() => turno.id),
  nome: text("nome").notNull(),
})
