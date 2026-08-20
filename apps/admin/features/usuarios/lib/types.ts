import type { Role } from '@repo/auth'

export interface UsuarioItem {
  id: string
  name: string
  email: string
  role: Role | null
  banned: boolean
  createdAt: string
}
