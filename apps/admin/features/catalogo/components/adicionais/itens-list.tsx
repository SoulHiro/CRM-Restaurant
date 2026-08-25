import { EmptyState } from '@repo/ui/components/empty-state'

import type { AdicionalItemOption } from '../../lib/types'
import { ItemRow } from './item-row'

export function ItensList({ itens }: { itens: AdicionalItemOption[] }) {
  if (itens.length === 0) {
    return (
      <EmptyState message="Nenhum item neste grupo ainda. Adicione o primeiro." />
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {itens.map((item) => (
        <ItemRow key={item.id} item={item} />
      ))}
    </div>
  )
}
