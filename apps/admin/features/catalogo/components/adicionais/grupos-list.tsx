import { EmptyState } from '@repo/ui/components/empty-state'

import type { GrupoAdicionalOption } from '../../lib/types'
import { GrupoRow } from './grupo-row'

export function GruposList({
  grupos,
  vazioMensagem,
}: {
  grupos: GrupoAdicionalOption[]
  vazioMensagem: string
}) {
  if (grupos.length === 0) {
    return <EmptyState message={vazioMensagem} />
  }

  return (
    <div className="flex flex-col gap-2">
      {grupos.map((grupo) => (
        <GrupoRow key={grupo.id} grupo={grupo} />
      ))}
    </div>
  )
}
