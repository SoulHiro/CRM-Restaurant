import { EmptyState } from '@repo/ui/components/empty-state'

import type { UsuarioItem } from '../lib/types'
import { UsuarioRow } from './usuario-row'

export function UsuariosLista({
  usuarios,
  usuarioAtualId,
}: {
  usuarios: UsuarioItem[]
  usuarioAtualId: string
}) {
  if (usuarios.length === 0) {
    return <EmptyState message="Nenhum usuário cadastrado ainda." />
  }

  return (
    <div className="flex flex-col gap-2">
      {usuarios.map((usuario) => (
        <UsuarioRow
          key={usuario.id}
          usuario={usuario}
          souEu={usuario.id === usuarioAtualId}
        />
      ))}
    </div>
  )
}
