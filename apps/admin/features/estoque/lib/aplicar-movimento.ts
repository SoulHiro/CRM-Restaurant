import 'server-only'

import { and, eq, sql } from 'drizzle-orm'

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
  /**
   * `undefined` = não mexe na validade do item; `string`/`null` = grava esse
   * valor. Quem chama já decide qual data é a mais próxima (ver
   * `receberCompraAction`) — esta função só aplica.
   */
  validade?: string | null
}

/**
 * Único caminho que altera `estoque_item.quantidade_atual`. Devolve os
 * statements prontos (update do saldo + movimento) em vez de executá-los,
 * para que o chamador junte vários itens num lote só — ver `executarLote`.
 *
 * O incremento é feito inteiramente em SQL (`quantidade_atual = quantidade_atual
 * + delta`), nunca lendo o saldo em JS para depois escrever um valor fixo —
 * isso é o que evita a race condition de duas movimentações concorrentes no
 * mesmo item (ex.: dois garçons lançando pedido ao mesmo tempo) se
 * sobrescreverem uma à outra. `saldo_resultante` do lançamento no livro-razão
 * é lido de volta do banco (subquery), depois do UPDATE já ter sido aplicado
 * — nunca calculado a partir de um saldo lido antes desta chamada. Os dois
 * statements precisam rodar nesta ordem dentro do mesmo `executarLote`
 * (update antes do insert) para a subquery enxergar o valor já atualizado.
 */
export function planejarMovimento(movimento: MovimentoPlanejado) {
  const delta = toNumericString(movimento.quantidade)

  const atualizarSaldo = db
    .update(estoque_item)
    .set({
      quantidade_atual: sql`${estoque_item.quantidade_atual} + ${delta}`,
      ...(movimento.validade !== undefined
        ? { validade: movimento.validade }
        : {}),
    })
    .where(eq(estoque_item.id, movimento.estoqueItemId))

  const inserirMovimento = db.insert(estoque_movimento).values({
    estoque_item_id: movimento.estoqueItemId,
    tipo: movimento.tipo,
    quantidade: delta,
    saldo_resultante: sql`(select ${estoque_item.quantidade_atual} from ${estoque_item} where ${estoque_item.id} = ${movimento.estoqueItemId})`,
    origem_tipo: movimento.origemTipo ?? null,
    origem_id: movimento.origemId ?? null,
    observacao: movimento.observacao ?? null,
    user_id: movimento.userId ?? null,
  })

  return {
    statements: [atualizarSaldo, inserirMovimento],
  }
}

/**
 * Também confirma que o item pertence ao estabelecimento ativo — sem isso,
 * um id de outro tenant (por engano ou adulterado) deixaria ler/mexer no
 * saldo de um item que não é deste `organizationId`.
 */
export async function lerSaldoAtual(
  organizationId: string,
  estoqueItemId: string
): Promise<number | null> {
  const [row] = await db
    .select({ quantidade: estoque_item.quantidade_atual })
    .from(estoque_item)
    .where(
      and(
        eq(estoque_item.id, estoqueItemId),
        eq(estoque_item.organization_id, organizationId)
      )
    )
    .limit(1)

  return row ? toNumber(row.quantidade) : null
}
