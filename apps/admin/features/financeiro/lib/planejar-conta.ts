import 'server-only'

import { db } from '@/lib/db'
import { toMoneyString } from '@/lib/numeric'
import { conta_a_pagar } from '@repo/db'

import type { DespesaCategoria, DespesaSubtipo } from './types'

export interface ContaPagarPlanejada {
  descricao: string
  categoria: DespesaCategoria
  subtipo: DespesaSubtipo
  valor: number
  dataVencimento: string
  /** Quem gerou a conta — hoje `'compra'`, na Fase 3 salário/benefício. */
  origemTipo: string
  origemId: string
  observacao?: string | null
  userId?: string | null
}

/**
 * Único caminho por onde outro módulo cria conta a pagar. Devolve o statement
 * em vez de executá-lo, para o chamador juntar tudo num `executarLote` só —
 * mesma disciplina de `planejarMovimento` no estoque.
 */
export function planejarContaPagar(conta: ContaPagarPlanejada) {
  return db.insert(conta_a_pagar).values({
    descricao: conta.descricao,
    categoria: conta.categoria,
    subtipo: conta.subtipo,
    valor: toMoneyString(conta.valor),
    data_vencimento: conta.dataVencimento,
    origem_tipo: conta.origemTipo,
    origem_id: conta.origemId,
    observacao: conta.observacao ?? null,
    user_id: conta.userId ?? null,
  })
}
