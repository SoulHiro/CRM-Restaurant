import { config } from "dotenv"
import { resolve } from "path"

// Load .env.local from apps/admin directory
config({ path: resolve(process.cwd(), ".env.local") })

import { auth } from "../lib/auth"
import { db } from "../lib/db"
import { sql } from "drizzle-orm"

async function main() {
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
  await db.execute(
    sql`UPDATE "user" SET role = 'admin' WHERE email = 'victormts.s1@gmail.com'`
  )

  console.log("✅ Role admin definida")
  console.log("📧 Email: victormts.s1@gmail.com")
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
