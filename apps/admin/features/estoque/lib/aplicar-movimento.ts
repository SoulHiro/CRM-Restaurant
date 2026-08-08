import 'server-only'

import { eq } from 'drizzle-orm'

import { db } from '@/lib/db'
import { toNumber, toNumericString } from '@/lib/numeric'
import { estoque_item, estoque_movimento } from '@repo/db'

import type { MovimentoTipo } from './types'

export interface MovimentoPlanejado {
  estoqueItemId: string
  tipo: MovimentoTipo
  /** Assinada: negativa em saída (perda, baixa de venda, ajuste para baixo). */
  quantidade: number
  origemTipo?: string
  origemId?: string
  observacao?: string
  userId?: string
}

export interface MovimentoAplicado {
  saldoAnterior: number
  saldoResultante: number
}

/**
 * Único caminho que altera `estoque_item.quantidade_atual`. Devolve os
 * statements prontos (movimento + update do saldo) em vez de executá-los, para
 * que o chamador junte vários itens num lote só — ver `executarLote`.
 */
export function planejarMovimento(
  movimento: MovimentoPlanejado,
  saldoAnterior: number
) {
  const saldoResultante =
    Math.round((saldoAnterior + movimento.quantidade) * 1000) / 1000

  const inserirMovimento = db.insert(estoque_movimento).values({
    estoque_item_id: movimento.estoqueItemId,
    tipo: movimento.tipo,
    quantidade: toNumericString(movimento.quantidade),
    saldo_resultante: toNumericString(saldoResultante),
    origem_tipo: movimento.origemTipo ?? null,
    origem_id: movimento.origemId ?? null,
    observacao: movimento.observacao ?? null,
    user_id: movimento.userId ?? null,
  })

  const atualizarSaldo = db
    .update(estoque_item)
    .set({ quantidade_atual: toNumericString(saldoResultante) })
    .where(eq(estoque_item.id, movimento.estoqueItemId))

  return {
    statements: [inserirMovimento, atualizarSaldo],
    resultado: { saldoAnterior, saldoResultante } satisfies MovimentoAplicado,
  }
}

export async function lerSaldoAtual(
  estoqueItemId: string
): Promise<number | null> {
  const [row] = await db
    .select({ quantidade: estoque_item.quantidade_atual })
    .from(estoque_item)
    .where(eq(estoque_item.id, estoqueItemId))
    .limit(1)

  return row ? toNumber(row.quantidade) : null
}
