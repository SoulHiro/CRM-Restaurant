import { headers } from 'next/headers'

import { auth } from '@/lib/auth'
import { CriarUsuarioDrawer } from '@/features/usuarios/components/criar-usuario-drawer'
import { UsuariosLista } from '@/features/usuarios/components/usuarios-lista'
import type { UsuarioItem } from '@/features/usuarios/lib/types'

export default async function UsuariosPage() {
  const hdrs = await headers()
  const [{ users }, session] = await Promise.all([
    auth.api.listUsers({
      query: { sortBy: 'name', sortDirection: 'asc', limit: 200 },
      headers: hdrs,
    }),
    auth.api.getSession({ headers: hdrs }),
  ])

  const usuarios: UsuarioItem[] = users.map(
    (u: {
      id: string
      name: string
      email: string
      role?: string | null
      banned?: boolean | null
      createdAt: Date
    }) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: (u.role as UsuarioItem['role']) ?? null,
      banned: u.banned ?? false,
      createdAt: u.createdAt.toISOString(),
    })
  )

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Usuários</h1>
          <p className="text-sm text-muted-foreground">
            Quem tem acesso ao sistema e o que cada cargo consegue ver — o cargo
            já define as permissões automaticamente.
          </p>
        </div>
        <CriarUsuarioDrawer />
      </div>

      <UsuariosLista
        usuarios={usuarios}
        usuarioAtualId={session?.user.id ?? ''}
      />
    </div>
  )
}
