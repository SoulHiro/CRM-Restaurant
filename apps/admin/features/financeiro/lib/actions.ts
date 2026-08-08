'use server'

import { revalidatePath } from 'next/cache'
import { and, eq } from 'drizzle-orm'

import { db } from '@/lib/db'
import { executarLote, type Statement } from '@/lib/db-batch'
import { toMoneyString } from '@/lib/numeric'
import { ActionError, authActionClient } from '@/lib/safe-action'
import {
  conta_a_pagar,
  conta_a_receber_b2b,
  meta,
  progresso_meta,
  transacao_financeira,
} from '@repo/db'

import {
  createContaPagarSchema,
  createContaReceberSchema,
  createTransacaoSchema,
  idSchema,
  marcarPagaSchema,
  registrarAjusteMetaSchema,
  updateContaPagarSchema,
  updateContaReceberSchema,
  updateTransacaoSchema,
  upsertMetaSchema,
} from './schemas'
import type {
  DespesaCategoria,
  DespesaSubtipo,
  TransacaoTipo,
} from './types'

function revalidarFinanceiro() {
  revalidatePath('/financeiro')
}

/** Categoria e subtipo só existem em despesa — receita não carrega nenhum. */
function classificacaoDespesa(input: {
  tipo: TransacaoTipo
  categoria?: DespesaCategoria
  subtipo?: DespesaSubtipo
}): { categoria: DespesaCategoria | null; subtipo: DespesaSubtipo | null } {
  if (input.tipo !== 'despesa') return { categoria: null, subtipo: null }
  return {
    categoria: input.categoria ?? null,
    subtipo: input.subtipo ?? null,
  }
}

export const createTransacaoAction = authActionClient
  .schema(createTransacaoSchema)
  .action(async ({ parsedInput, ctx }) => {
    const [criada] = await db
      .insert(transacao_financeira)
      .values({
        tipo: parsedInput.tipo,
        origem: parsedInput.origem,
        valor: toMoneyString(parsedInput.valor),
        data: parsedInput.data,
        descricao: parsedInput.descricao.trim(),
        ...classificacaoDespesa(parsedInput),
        user_id: ctx.user.id,
      })
      .returning({ id: transacao_financeira.id })

    if (!criada) throw new ActionError('Não foi possível lançar')

    revalidarFinanceiro()
    return { transacaoId: criada.id }
  })

/**
 * Só lançamento feito à mão é editável. Transação nascida de uma conta paga é
 * consequência daquela conta — mexer nela por fora quebraria o par
 * conta ↔ lançamento e o DRE passaria a discordar das contas.
 */
async function exigirTransacaoManual(id: string) {
  const row = await db.query.transacao_financeira.findFirst({
    where: eq(transacao_financeira.id, id),
    columns: { id: true, origem_id: true },
  })

  if (!row) throw new ActionError('Lançamento não encontrado')
  if (row.origem_id != null) {
    throw new ActionError(
      'Esse lançamento veio de uma conta — altere pela própria conta.'
    )
  }
}

export const updateTransacaoAction = authActionClient
  .schema(updateTransacaoSchema)
  .action(async ({ parsedInput }) => {
    await exigirTransacaoManual(parsedInput.id)

    await db
      .update(transacao_financeira)
      .set({
        tipo: parsedInput.tipo,
        origem: parsedInput.origem,
        valor: toMoneyString(parsedInput.valor),
        data: parsedInput.data,
        descricao: parsedInput.descricao.trim(),
        ...classificacaoDespesa(parsedInput),
      })
      .where(eq(transacao_financeira.id, parsedInput.id))

    revalidarFinanceiro()
    return { transacaoId: parsedInput.id }
  })

export const deleteTransacaoAction = authActionClient
  .schema(idSchema)
  .action(async ({ parsedInput }) => {
    await exigirTransacaoManual(parsedInput.id)

    await db
      .delete(transacao_financeira)
      .where(eq(transacao_financeira.id, parsedInput.id))

    revalidarFinanceiro()
    return { transacaoId: parsedInput.id }
  })

export const createContaPagarAction = authActionClient
  .schema(createContaPagarSchema)
  .action(async ({ parsedInput, ctx }) => {
    const [criada] = await db
      .insert(conta_a_pagar)
      .values({
        descricao: parsedInput.descricao.trim(),
        categoria: parsedInput.categoria,
        subtipo: parsedInput.subtipo,
        valor: toMoneyString(parsedInput.valor),
        data_vencimento: parsedInput.dataVencimento,
        observacao: parsedInput.observacao?.trim() || null,
        user_id: ctx.user.id,
      })
      .returning({ id: conta_a_pagar.id })

    if (!criada) throw new ActionError('Não foi possível criar a conta')

    revalidarFinanceiro()
    return { contaId: criada.id }
  })

export const updateContaPagarAction = authActionClient
  .schema(updateContaPagarSchema)
  .action(async ({ parsedInput }) => {
    await db
      .update(conta_a_pagar)
      .set({
        descricao: parsedInput.descricao.trim(),
        categoria: parsedInput.categoria,
        subtipo: parsedInput.subtipo,
        valor: toMoneyString(parsedInput.valor),
        data_vencimento: parsedInput.dataVencimento,
        observacao: parsedInput.observacao?.trim() || null,
      })
      .where(eq(conta_a_pagar.id, parsedInput.id))

    revalidarFinanceiro()
    return { contaId: parsedInput.id }
  })

export const deleteContaPagarAction = authActionClient
  .schema(idSchema)
  .action(async ({ parsedInput }) => {
    const conta = await db.query.conta_a_pagar.findFirst({
      where: eq(conta_a_pagar.id, parsedInput.id),
      columns: { status: true },
    })

    if (!conta) throw new ActionError('Conta não encontrada')
    if (conta.status === 'pago') {
      throw new ActionError(
        'Essa conta já foi paga. Desfaça o pagamento antes de excluir.'
      )
    }

    await db.delete(conta_a_pagar).where(eq(conta_a_pagar.id, parsedInput.id))

    revalidarFinanceiro()
    return { contaId: parsedInput.id }
  })

/**
 * Pagar não é só mudar o status: é o momento em que a previsão vira dinheiro
 * de verdade. Por isso a transação entra no mesmo lote — se uma falhar,
 * nenhuma passa, e o DRE nunca fica dessincronizado das contas.
 */
export const marcarContaPagaAction = authActionClient
  .schema(marcarPagaSchema)
  .action(async ({ parsedInput, ctx }) => {
    const conta = await db.query.conta_a_pagar.findFirst({
      where: eq(conta_a_pagar.id, parsedInput.id),
    })

    if (!conta) throw new ActionError('Conta não encontrada')
    if (conta.status === 'pago') {
      throw new ActionError('Essa conta já está paga.')
    }

    await executarLote([
      db
        .update(conta_a_pagar)
        .set({ status: 'pago', data_pagamento: parsedInput.dataPagamento })
        .where(eq(conta_a_pagar.id, conta.id)),
      db.insert(transacao_financeira).values({
        tipo: 'despesa',
        origem: 'manual',
        valor: conta.valor,
        data: parsedInput.dataPagamento,
        descricao: conta.descricao,
        categoria: conta.categoria,
        subtipo: conta.subtipo,
        origem_tipo: 'conta_a_pagar',
        origem_id: conta.id,
        user_id: ctx.user.id,
      }),
    ])

    revalidarFinanceiro()
    return { contaId: conta.id }
  })

export const desfazerPagamentoAction = authActionClient
  .schema(idSchema)
  .action(async ({ parsedInput }) => {
    const conta = await db.query.conta_a_pagar.findFirst({
      where: eq(conta_a_pagar.id, parsedInput.id),
      columns: { id: true, status: true },
    })

    if (!conta) throw new ActionError('Conta não encontrada')
    if (conta.status !== 'pago') {
      throw new ActionError('Essa conta não está paga.')
    }

    await executarLote([
      db
        .update(conta_a_pagar)
        .set({ status: 'pendente', data_pagamento: null })
        .where(eq(conta_a_pagar.id, conta.id)),
      // Apaga a transação gerada por esta conta — sem isso sobraria despesa
      // órfã inflando o DRE.
      db
        .delete(transacao_financeira)
        .where(
          and(
            eq(transacao_financeira.origem_tipo, 'conta_a_pagar'),
            eq(transacao_financeira.origem_id, conta.id)
          )
        ),
    ])

    revalidarFinanceiro()
    return { contaId: conta.id }
  })

export const createContaReceberAction = authActionClient
  .schema(createContaReceberSchema)
  .action(async ({ parsedInput, ctx }) => {
    const [criada] = await db
      .insert(conta_a_receber_b2b)
      .values({
        empresa_nome: parsedInput.empresaNome.trim(),
        periodo: parsedInput.periodo.trim(),
        valor: toMoneyString(parsedInput.valor),
        data_vencimento: parsedInput.dataVencimento,
        observacao: parsedInput.observacao?.trim() || null,
        user_id: ctx.user.id,
      })
      .returning({ id: conta_a_receber_b2b.id })

    if (!criada) throw new ActionError('Não foi possível criar a cobrança')

    revalidarFinanceiro()
    return { contaId: criada.id }
  })

export const updateContaReceberAction = authActionClient
  .schema(updateContaReceberSchema)
  .action(async ({ parsedInput }) => {
    await db
      .update(conta_a_receber_b2b)
      .set({
        empresa_nome: parsedInput.empresaNome.trim(),
        periodo: parsedInput.periodo.trim(),
        valor: toMoneyString(parsedInput.valor),
        data_vencimento: parsedInput.dataVencimento,
        observacao: parsedInput.observacao?.trim() || null,
      })
      .where(eq(conta_a_receber_b2b.id, parsedInput.id))

    revalidarFinanceiro()
    return { contaId: parsedInput.id }
  })

export const deleteContaReceberAction = authActionClient
  .schema(idSchema)
  .action(async ({ parsedInput }) => {
    const conta = await db.query.conta_a_receber_b2b.findFirst({
      where: eq(conta_a_receber_b2b.id, parsedInput.id),
      columns: { status: true },
    })

    if (!conta) throw new ActionError('Cobrança não encontrada')
    if (conta.status === 'pago') {
      throw new ActionError(
        'Essa cobrança já foi recebida. Desfaça o recebimento antes de excluir.'
      )
    }

    await db
      .delete(conta_a_receber_b2b)
      .where(eq(conta_a_receber_b2b.id, parsedInput.id))

    revalidarFinanceiro()
    return { contaId: parsedInput.id }
  })

export const marcarContaRecebidaAction = authActionClient
  .schema(marcarPagaSchema)
  .action(async ({ parsedInput, ctx }) => {
    const conta = await db.query.conta_a_receber_b2b.findFirst({
      where: eq(conta_a_receber_b2b.id, parsedInput.id),
    })

    if (!conta) throw new ActionError('Cobrança não encontrada')
    if (conta.status === 'pago') {
      throw new ActionError('Essa cobrança já foi recebida.')
    }

    await executarLote([
      db
        .update(conta_a_receber_b2b)
        .set({ status: 'pago', data_pagamento: parsedInput.dataPagamento })
        .where(eq(conta_a_receber_b2b.id, conta.id)),
      db.insert(transacao_financeira).values({
        tipo: 'receita',
        origem: 'marmita_b2b',
        valor: conta.valor,
        data: parsedInput.dataPagamento,
        descricao: `${conta.empresa_nome} — ${conta.periodo}`,
        origem_tipo: 'conta_a_receber_b2b',
        origem_id: conta.id,
        user_id: ctx.user.id,
      }),
    ])

    revalidarFinanceiro()
    return { contaId: conta.id }
  })

export const desfazerRecebimentoAction = authActionClient
  .schema(idSchema)
  .action(async ({ parsedInput }) => {
    const conta = await db.query.conta_a_receber_b2b.findFirst({
      where: eq(conta_a_receber_b2b.id, parsedInput.id),
      columns: { id: true, status: true },
    })

    if (!conta) throw new ActionError('Cobrança não encontrada')
    if (conta.status !== 'pago') {
      throw new ActionError('Essa cobrança não foi recebida.')
    }

    await executarLote([
      db
        .update(conta_a_receber_b2b)
        .set({ status: 'pendente', data_pagamento: null })
        .where(eq(conta_a_receber_b2b.id, conta.id)),
      db
        .delete(transacao_financeira)
        .where(
          and(
            eq(transacao_financeira.origem_tipo, 'conta_a_receber_b2b'),
            eq(transacao_financeira.origem_id, conta.id)
          )
        ),
    ])

    revalidarFinanceiro()
    return { contaId: conta.id }
  })

/**
 * Uma meta financeira ativa por vez — o painel mostra uma só, e ter duas
 * "valendo" tornaria ambíguo contra qual delas o progresso é medido.
 */
export const upsertMetaAction = authActionClient
  .schema(upsertMetaSchema)
  .action(async ({ parsedInput }) => {
    const valorAlvo =
      parsedInput.tipo === 'financeira' && parsedInput.valorAlvo != null
        ? toMoneyString(parsedInput.valorAlvo)
        : null

    if (parsedInput.id) {
      await db
        .update(meta)
        .set({
          descricao: parsedInput.descricao.trim(),
          tipo: parsedInput.tipo,
          valor_alvo: valorAlvo,
          inicio: parsedInput.inicio,
          prazo: parsedInput.prazo,
        })
        .where(eq(meta.id, parsedInput.id))

      revalidarFinanceiro()
      return { metaId: parsedInput.id }
    }

    // Desativa a anterior ANTES de inserir — na ordem inversa, o update
    // pegaria também a meta recém-criada e ela já nasceria desativada.
    if (parsedInput.tipo === 'financeira') {
      await db
        .update(meta)
        .set({ ativa: false })
        .where(and(eq(meta.ativa, true), eq(meta.tipo, 'financeira')))
    }

    const [criada] = await db
      .insert(meta)
      .values({
        descricao: parsedInput.descricao.trim(),
        tipo: parsedInput.tipo,
        valor_alvo: valorAlvo,
        inicio: parsedInput.inicio,
        prazo: parsedInput.prazo,
      })
      .returning({ id: meta.id })

    if (!criada) throw new ActionError('Não foi possível criar a meta')

    revalidarFinanceiro()
    return { metaId: criada.id }
  })

export const registrarAjusteMetaAction = authActionClient
  .schema(registrarAjusteMetaSchema)
  .action(async ({ parsedInput, ctx }) => {
    const alvo = await db.query.meta.findFirst({
      where: eq(meta.id, parsedInput.metaId),
      columns: { id: true },
    })

    if (!alvo) throw new ActionError('Meta não encontrada')

    const [criado] = await db
      .insert(progresso_meta)
      .values({
        meta_id: alvo.id,
        data: parsedInput.data,
        valor: toMoneyString(parsedInput.valor),
        origem: 'ajuste_manual',
        observacao: parsedInput.observacao?.trim() || null,
        user_id: ctx.user.id,
      })
      .returning({ id: progresso_meta.id })

    revalidarFinanceiro()
    return { ajusteId: criado?.id }
  })

export const removerAjusteMetaAction = authActionClient
  .schema(idSchema)
  .action(async ({ parsedInput }) => {
    await db
      .delete(progresso_meta)
      .where(eq(progresso_meta.id, parsedInput.id))

    revalidarFinanceiro()
    return { ajusteId: parsedInput.id }
  })
