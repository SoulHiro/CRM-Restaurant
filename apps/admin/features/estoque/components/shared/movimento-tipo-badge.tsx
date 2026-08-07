import { Badge } from '@repo/ui/components/badge'

import type { MovimentoTipo } from '../../lib/types'

const TIPO_LABELS: Record<MovimentoTipo, string> = {
  entrada_compra: 'Entrada de compra',
  perda: 'Perda',
  ajuste_inventario: 'Ajuste de inventário',
  baixa_venda: 'Baixa por venda',
  ajuste_manual: 'Ajuste manual',
}

export function MovimentoTipoBadge({ tipo }: { tipo: MovimentoTipo }) {
  return (
    <Badge variant={tipo === 'perda' ? 'destructive' : 'secondary'}>
      {TIPO_LABELS[tipo]}
    </Badge>
  )
}

export { TIPO_LABELS as MOVIMENTO_TIPO_LABELS }
