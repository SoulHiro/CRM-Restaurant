'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

import { db } from '@/lib/db'
import { hojeISO } from '@/lib/formatters'
import { toMoneyString } from '@/lib/numeric'
import { ActionError, authActionClient } from '@/lib/safe-action'
import { consumo_funcionario } from '@repo/db'

import { quitarConsumoSchema, registrarConsumoSchema } from './schemas'

export const registrarConsumoAction = authActionClient
  .schema(registrarConsumoSchema)
  .action(async ({ parsedInput, ctx }) => {
    const produtoRow = await db.query.produto.findFirst({
      where: (produto, { eq }) => eq(produto.id, parsedInput.produtoId),
    })
    if (!produtoRow) throw new ActionError('Produto não encontrado')

    let precoUnitario = produtoRow.preco_venda == null
      ? 0
      : Number(produtoRow.preco_venda)

    if (produtoRow.tem_tamanhos) {
      const tamanhos = await db.query.produto_tamanho.findMany({
        where: (t, { eq }) => eq(t.produto_id, produtoRow.id),
        columns: { preco_venda: true },
      })
      const precos = tamanhos.map((t) => Number(t.preco_venda))
      precoUnitario = precos.length > 0 ? Math.min(...precos) : 0
    }

    await db.insert(consumo_funcionario).values({
      funcionario_interno_id: parsedInput.funcionarioId,
      produto_id: parsedInput.produtoId,
      quantidade: parsedInput.quantidade,
      preco_unitario: toMoneyString(precoUnitario),
      user_id: ctx.user.id,
    })

    revalidatePath('/caixa')
    return { ok: true as const }
  })

export const quitarConsumoAction = authActionClient
  .schema(quitarConsumoSchema)
  .action(async ({ parsedInput }) => {
    await db
      .update(consumo_funcionario)
      .set({ status: 'pago', data_pagamento: hojeISO() })
      .where(
        and(
          eq(
            consumo_funcionario.funcionario_interno_id,
            parsedInput.funcionarioId
          ),
          eq(consumo_funcionario.status, 'pendente')
        )
      )

    revalidatePath('/caixa')
    return { ok: true as const }
  })
