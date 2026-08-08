import 'server-only'

import { db } from './db'

export type Statement = Parameters<typeof db.batch>[0][number]

/**
 * `db.batch` é a única forma de transação do driver neon-http — a variante
 * interativa `db.transaction(cb)` lança em runtime. Por isso toda action que
 * precisa de atomicidade lê e calcula antes, e manda só os statements prontos.
 */
export async function executarLote(statements: Statement[]): Promise<void> {
  if (statements.length === 0) return
  await db.batch(statements as [Statement, ...Statement[]])
}
