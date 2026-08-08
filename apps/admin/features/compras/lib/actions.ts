'use server'

import { revalidatePath } from 'next/cache'
import { and, eq, inArray } from 'drizzle-orm'

import { planejarMovimento } from '@/features/estoque/lib/aplicar-movimento'
import { planejarContaPagar } from '@/features/financeiro/lib/planejar-conta'
import { db } from '@/lib/db'
import { executarLote, type Statement } from '@/lib/db-batch'
import { toMoneyString, toNumber, toNumericString } from '@/lib/numeric'
import { ActionError, authActionClient } from '@/lib/safe-action'
import {
  avaliacao_fornecedor,
  compra,
  compra_item,
  conta_a_pagar,
  estoque_item,
  fornecedor,
  fornecedor_item,
  historico_preco_insumo,
} from '@repo/db'

import { totalCompra } from './compra-helpers'
import {
  createCompraSchema,
  idSchema,
  receberCompraSchema,
  registrarAvaliacaoSchema,
  upsertFornecedorItemSchema,
  upsertFornecedorSchema,
} from './schemas'

function revalidarCompras() {
  revalidatePath('/compras')
  revalidatePath('/financeiro')
  revalidatePath('/estoque')
}

/**
 * A compra nasce inteira num lote só: cabeçalho, linhas e a conta a pagar que
 * ela gera. Se a conta não entrasse aqui, a despesa dependeria de alguém
 * lembrar de lançá-la — que é exatamente a digitação dupla que esta fase acaba.
 */
export const createCompraAction = authActionClient
  .schema(createCompraSchema)
  .action(async ({ parsedInput, ctx }) => {
    const fornecedorRow = await db.query.fornecedor.findFirst({
      where: eq(fornecedor.id, parsedInput.fornecedorId),
      columns: { id: true, nome: true },
    })
    if (!fornecedorRow) throw new ActionError('Fornecedor não encontrado')

    const ids = parsedInput.linhas.map((linha) => linha.estoqueItemId)
    const itens = await db.query.estoque_item.findMany({
      where: inArray(estoque_item.id, ids),
      columns: { id: true, ativo: true },
    })

    if (itens.length !== ids.length) {
      throw new ActionError('Algum item da nota não existe mais no estoque')
    }
    if (itens.some((item) => !item.ativo)) {
      throw new ActionError('Não dá para comprar um item desativado')
    }

    const total = totalCompra(parsedInput.linhas)

    const [criada] = await db
      .insert(compra)
      .values({
        fornecedor_id: parsedInput.fornecedorId,
        numero_nota_fiscal: parsedInput.numeroNotaFiscal?.trim() || null,
        categoria_despesa: parsedInput.categoriaDespesa,
        data_pedido: parsedInput.dataPedido,
        forma_pagamento: parsedInput.formaPagamento?.trim() || null,
        observacao: parsedInput.observacao?.trim() || null,
        user_id: ctx.user.id,
      })
      .returning({ id: compra.id })

    if (!criada) throw new ActionError('Não foi possível registrar a compra')

    const descricaoConta = parsedInput.numeroNotaFiscal?.trim()
      ? `Compra ${parsedInput.numeroNotaFiscal.trim()} — ${fornecedorRow.nome}`
      : `Compra — ${fornecedorRow.nome}`

    await executarLote([
      db.insert(compra_item).values(
        parsedInput.linhas.map((linha) => ({
          compra_id: criada.id,
          estoque_item_id: linha.estoqueItemId,
          quantidade: toNumericString(linha.quantidade),
          valor_unitario: toMoneyString(linha.valorUnitario),
        }))
      ),
      planejarContaPagar({
        descricao: descricaoConta,
        categoria: 'variavel',
        subtipo: parsedInput.categoriaDespesa,
        valor: total,
        dataVencimento: parsedInput.dataVencimento,
        origemTipo: 'compra',
        origemId: criada.id,
        userId: ctx.user.id,
      }),
    ])

    revalidarCompras()
    return { compraId: criada.id, total }
  })

/**
 * Receber é definitivo, como finalizar inventário: os movimentos de entrada
 * encadeiam `saldo_resultante`, e apagá-los depois faria todo movimento
 * posterior daquele item mentir. Correção pós-recebimento é por "Ajustar
 * quantidade", no estoque.
 */
export const receberCompraAction = authActionClient
  .schema(receberCompraSchema)
  .action(async ({ parsedInput, ctx }) => {
    const row = await db.query.compra.findFirst({
      where: eq(compra.id, parsedInput.id),
      with: { itens: true },
    })

    if (!row) throw new ActionError('Compra não encontrada')
    if (row.status === 'recebido') {
      throw new ActionError('Essa compra já foi recebida.')
    }
    if (row.status === 'cancelado') {
      throw new ActionError('Compra cancelada não pode ser recebida.')
    }
    if (row.itens.length === 0) {
      throw new ActionError('A compra não tem itens para dar entrada.')
    }

    const saldos = await db.query.estoque_item.findMany({
      where: inArray(
        estoque_item.id,
        row.itens.map((linha) => linha.estoque_item_id)
      ),
      columns: { id: true, quantidade_atual: true },
    })
    const saldoPorItem = new Map(
      saldos.map((item) => [item.id, toNumber(item.quantidade_atual)])
    )

    const statements: Statement[] = [
      db
        .update(compra)
        .set({ status: 'recebido', data_recebimento: parsedInput.dataRecebimento })
        .where(eq(compra.id, row.id)),
    ]

    for (const linha of row.itens) {
      const saldoAnterior = saldoPorItem.get(linha.estoque_item_id)
      if (saldoAnterior == null) {
        throw new ActionError('Algum item da nota não existe mais no estoque')
      }

      const { statements: movimento, resultado } = planejarMovimento(
        {
          estoqueItemId: linha.estoque_item_id,
          tipo: 'entrada_compra',
          quantidade: toNumber(linha.quantidade),
          origemTipo: 'compra',
          origemId: row.id,
          userId: ctx.user.id,
        },
        saldoAnterior
      )

      statements.push(...movimento)
      saldoPorItem.set(linha.estoque_item_id, resultado.saldoResultante)

      statements.push(
        db.insert(historico_preco_insumo).values({
          estoque_item_id: linha.estoque_item_id,
          fornecedor_id: row.fornecedor_id,
          preco: linha.valor_unitario,
          data_vigencia: parsedInput.dataRecebimento,
        })
      )
    }

    await executarLote(statements)

    revalidarCompras()
    return { compraId: row.id, itensRecebidos: row.itens.length }
  })

export const cancelarCompraAction = authActionClient
  .schema(idSchema)
  .action(async ({ parsedInput }) => {
    const row = await db.query.compra.findFirst({
      where: eq(compra.id, parsedInput.id),
      columns: { id: true, status: true },
    })

    if (!row) throw new ActionError('Compra não encontrada')
    if (row.status === 'recebido') {
      throw new ActionError(
        'Essa compra já foi recebida e entrou no estoque. Corrija pelo ajuste de quantidade do item.'
      )
    }
    if (row.status === 'cancelado') {
      throw new ActionError('Essa compra já está cancelada.')
    }

    const conta = await db.query.conta_a_pagar.findFirst({
      where: and(
        eq(conta_a_pagar.origem_tipo, 'compra'),
        eq(conta_a_pagar.origem_id, row.id)
      ),
      columns: { id: true, status: true },
    })

    if (conta?.status === 'pago') {
      throw new ActionError(
        'A conta dessa compra já foi paga. Desfaça o pagamento no financeiro antes de cancelar.'
      )
    }

    const statements: Statement[] = [
      db.update(compra).set({ status: 'cancelado' }).where(eq(compra.id, row.id)),
    ]

    if (conta) {
      statements.push(
        db.delete(conta_a_pagar).where(eq(conta_a_pagar.id, conta.id))
      )
    }

    await executarLote(statements)

    revalidarCompras()
    return { compraId: row.id }
  })

export const upsertFornecedorAction = authActionClient
  .schema(upsertFornecedorSchema)
  .action(async ({ parsedInput }) => {
    const valores = {
      nome: parsedInput.nome.trim(),
      contato: parsedInput.contato?.trim() || null,
      prazo_entrega_dias: parsedInput.prazoEntregaDias ?? null,
      prazo_pagamento: parsedInput.prazoPagamento?.trim() || null,
    }

    if (parsedInput.id) {
      await db
        .update(fornecedor)
        .set(valores)
        .where(eq(fornecedor.id, parsedInput.id))

      revalidarCompras()
      return { fornecedorId: parsedInput.id }
    }

    const [criado] = await db
      .insert(fornecedor)
      .values(valores)
      .returning({ id: fornecedor.id })

    if (!criado) throw new ActionError('Não foi possível salvar o fornecedor')

    revalidarCompras()
    return { fornecedorId: criado.id }
  })

export const deleteFornecedorAction = authActionClient
  .schema(idSchema)
  .action(async ({ parsedInput }) => {
    const compras = await db.query.compra.findFirst({
      where: eq(compra.fornecedor_id, parsedInput.id),
      columns: { id: true },
    })

    if (compras) {
      throw new ActionError(
        'Esse fornecedor já tem compras registradas e não pode ser excluído.'
      )
    }

    await db.delete(fornecedor).where(eq(fornecedor.id, parsedInput.id))

    revalidarCompras()
    return { fornecedorId: parsedInput.id }
  })

export const upsertFornecedorItemAction = authActionClient
  .schema(upsertFornecedorItemSchema)
  .action(async ({ parsedInput }) => {
    const valores = {
      fornecedor_id: parsedInput.fornecedorId,
      estoque_item_id: parsedInput.estoqueItemId,
      preco: toMoneyString(parsedInput.preco),
      prazo_entrega_dias: parsedInput.prazoEntregaDias ?? null,
      observacao: parsedInput.observacao?.trim() || null,
    }

    if (parsedInput.id) {
      await db
        .update(fornecedor_item)
        .set(valores)
        .where(eq(fornecedor_item.id, parsedInput.id))

      revalidarCompras()
      return { ofertaId: parsedInput.id }
    }

    // Um fornecedor tem um preço por item; repetir o cadastro é atualizar o
    // preço, não criar uma segunda linha (unique no banco).
    const [salvo] = await db
      .insert(fornecedor_item)
      .values(valores)
      .onConflictDoUpdate({
        target: [fornecedor_item.fornecedor_id, fornecedor_item.estoque_item_id],
        set: {
          preco: valores.preco,
          prazo_entrega_dias: valores.prazo_entrega_dias,
          observacao: valores.observacao,
        },
      })
      .returning({ id: fornecedor_item.id })

    if (!salvo) throw new ActionError('Não foi possível salvar o preço')

    revalidarCompras()
    return { ofertaId: salvo.id }
  })

export const deleteFornecedorItemAction = authActionClient
  .schema(idSchema)
  .action(async ({ parsedInput }) => {
    await db.delete(fornecedor_item).where(eq(fornecedor_item.id, parsedInput.id))

    revalidarCompras()
    return { ofertaId: parsedInput.id }
  })

export const registrarAvaliacaoAction = authActionClient
  .schema(registrarAvaliacaoSchema)
  .action(async ({ parsedInput, ctx }) => {
    const [criada] = await db
      .insert(avaliacao_fornecedor)
      .values({
        fornecedor_id: parsedInput.fornecedorId,
        data: parsedInput.data,
        nota: parsedInput.nota,
        tipo: parsedInput.tipo,
        observacao: parsedInput.observacao?.trim() || null,
        user_id: ctx.user.id,
      })
      .returning({ id: avaliacao_fornecedor.id })

    if (!criada) throw new ActionError('Não foi possível registrar a avaliação')

    revalidarCompras()
    return { avaliacaoId: criada.id }
  })

export const deleteAvaliacaoAction = authActionClient
  .schema(idSchema)
  .action(async ({ parsedInput }) => {
    await db
      .delete(avaliacao_fornecedor)
      .where(eq(avaliacao_fornecedor.id, parsedInput.id))

    revalidarCompras()
    return { avaliacaoId: parsedInput.id }
  })
