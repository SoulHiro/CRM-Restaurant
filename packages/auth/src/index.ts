import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { admin as adminPlugin } from "better-auth/plugins"

export type { Session, User } from "better-auth"

export const roles = [
  "admin",
  "caixa",
  "financeiro",
  "cozinha",
  "garcom",
  "empresa",
  "funcionario",
  "cliente",
] as const
export type Role = typeof roles[number]

export function createAuth(db: Parameters<typeof drizzleAdapter>[0]) {
  return betterAuth({
    database: drizzleAdapter(db, { provider: "pg" }),
    plugins: [adminPlugin()],
  })
}
