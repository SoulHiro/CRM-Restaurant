import type { PedidoDoDiaItem } from './types'

export type StatusImpressao = 'novo' | 'atualizado' | 'impresso'

export const STATUS_IMPRESSAO_LABEL: Record<StatusImpressao, string> = {
  novo: 'Novo',
  atualizado: 'Atualizado',
  impresso: 'Impresso',
}

/**
 * Nunca gravado — sempre comparado na hora: `impressoEm` só avança quando a
 * impressão de verdade termina (`marcarPedidosImpressosAction`);
 * `importadoEm` avança em toda reimportação/edição manual que mude a linha.
 * Se o pedido mudou depois da última impressão, precisa reimprimir.
 */
export function statusImpressao(pedido: PedidoDoDiaItem): StatusImpressao {
  if (!pedido.impressoEm) return 'novo'
  if (new Date(pedido.importadoEm) > new Date(pedido.impressoEm)) {
    return 'atualizado'
  }
  return 'impresso'
}
