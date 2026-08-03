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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createAuth(db: Parameters<typeof drizzleAdapter>[0]): any {
  return betterAuth({
    baseURL: process.env.BETTER_AUTH_URL,
    secret: process.env.BETTER_AUTH_SECRET,
    emailAndPassword: { enabled: true },
    database: drizzleAdapter(db, { provider: "pg" }),
    plugins: [adminPlugin()],
  })
}
