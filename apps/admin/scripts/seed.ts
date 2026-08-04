import { config } from "dotenv"
import { resolve } from "path"
import { fileURLToPath } from "url"

const __dirname = fileURLToPath(new URL(".", import.meta.url))

// Must run BEFORE importing @repo/db (Neon reads DATABASE_URL at init time)
config({ path: resolve(__dirname, "../.env.local") })

// Dynamic imports so dotenv has already populated process.env
const { auth } = await import("../lib/auth.js")
const { db } = await import("../lib/db.js")

console.log("🌱 Criando usuário admin...")

try {
  await auth.api.signUpEmail({
    body: {
      name: "Victor",
      email: "victormts.s1@gmail.com",
      password: "Terraria891-+@%#$",
    },
  })
  console.log("✅ Usuário criado")
} catch {
  console.log("⚠️  Usuário já existe, atualizando role...")
}

// Better Auth adminPlugin stores role in "role" column of "user" table
// eslint-disable-next-line @typescript-eslint/no-explicit-any
await (db as any).execute(
  `UPDATE "user" SET role = 'admin' WHERE email = 'victormts.s1@gmail.com'`
)

console.log("✅ Role admin definida")
console.log("📧 Email: victormts.s1@gmail.com")
process.exit(0)
