import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { admin as adminPlugin } from 'better-auth/plugins'

export type { Session, User } from 'better-auth'

export const roles = [
  'admin',
  'caixa',
  'financeiro',
  'cozinha',
  'garcom',
  'empresa',
  'funcionario',
  'cliente',
] as const
export type Role = (typeof roles)[number]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createAuth(db: Parameters<typeof drizzleAdapter>[0]): any {
  return betterAuth({
    baseURL: process.env.BETTER_AUTH_URL,
    secret: process.env.BETTER_AUTH_SECRET,
    emailAndPassword: { enabled: true },
    database: drizzleAdapter(db, { provider: 'pg' }),
    plugins: [adminPlugin()],
    session: {
      // Evita bater no Postgres a cada getSession() (ex: proxy.ts roda em
      // toda navegação) — a sessão fica servida por um cookie assinado
      // dentro dessa janela, revalidando no banco depois que ela expira.
      cookieCache: {
        enabled: true,
        maxAge: 60,
      },
    },
  })
}
