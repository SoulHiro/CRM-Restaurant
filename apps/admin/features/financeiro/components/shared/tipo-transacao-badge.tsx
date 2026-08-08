import { Badge } from '@repo/ui/components/badge'

import { CATEGORIA_LABELS } from '../../lib/dre-helpers'
import type { DespesaCategoria, TransacaoTipo } from '../../lib/types'

export function TipoTransacaoBadge({
  tipo,
  categoria,
}: {
  tipo: TransacaoTipo
  categoria?: DespesaCategoria | null
}) {
  if (tipo === 'receita') {
    return <Badge variant="default">Entrada</Badge>
  }

  return (
    <Badge variant="secondary">
      Saída{categoria ? ` · ${CATEGORIA_LABELS[categoria]}` : ''}
    </Badge>
  )
}
