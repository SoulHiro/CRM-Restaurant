'use server'

import { revalidatePath } from 'next/cache'
import { and, eq, inArray } from 'drizzle-orm'
import { createId } from '@paralleldrive/cuid2'

import { lerSaldoAtual, planejarMovimento } from '@/features/estoque/lib/aplicar-movimento'
import { db } from '@/lib/db'
import { executarLote, type Statement } from '@/lib/db-batch'
import { hojeISO } from '@/lib/formatters'
import { toMoneyString, toNumericString } from '@/lib/numeric'
import { notificarSalao } from '@/lib/pusher-server'
import {
  ActionError,
  caixaActionClient,
  garcomActionClient,
  tenantActionClient,
} from '@/lib/safe-action'
import {
  comanda,
  comanda_item,
  comanda_pagamento,
  transacao_financeira,
} from '@repo/db'
import { z } from 'zod'

import { calcularConsumoInsumos } from './ficha-tecnica-consumo'
import { centavosParaReais, somarCentavos } from './dinheiro'
import { getComandasAbertas, getFichaTecnicaParaConsumo } from './queries'
import {
  abrirComandaSchema,
  cancelarComandaSchema,
  editarItemSchema,
  enviarCozinhaSchema,
  excluirItemSchema,
  lancarItemSchema,
  marcarNotaPendenteSchema,
  registrarPagamentoSchema,
} from './schemas'

/** Leitura compartilhada por garçom e caixa — usada pro polling de `useComandas`. */
export const getComandasAbertasAction = tenantActionClient
  .schema(z.object({}))
  .action(async ({ ctx }) => getComandasAbertas(ctx.organizationId))

function revalidarSalao() {
  revalidatePath('/mesas')
  revalidatePath('/caixa')
}

async function buscarComandaAberta(organizationId: string, comandaId: string) {
  const row = await db.query.comanda.findFirst({
    where: (c, { eq: eqOp, and: andOp }) =>
      andOp(eqOp(c.id, comandaId), eqOp(c.organization_id, organizationId)),
  })
  if (!row) throw new ActionError('Comanda não encontrada.')
  if (row.status !== 'aberta') throw new ActionError('Essa comanda não está mais aberta.')
  return row
}

/** Statements de estoque pra um consumo de insumos — sempre lê o saldo atual antes de planejar. */
async function planejarConsumo(
  organizationId: string,
  consumo: { estoqueItemId: string; quantidade: number }[],
  tipo: 'baixa_venda' | 'estorno_venda',
  origemId: string,
  userId: string
): Promise<Statement[]> {
  const statements: Statement[] = []
  for (const linha of consumo) {
    if (linha.quantidade === 0) continue
    const saldoAnterior = await lerSaldoAtual(organizationId, linha.estoqueItemId)
    if (saldoAnterior == null) {
      throw new ActionError('Algum insumo da ficha técnica não existe mais no estoque.')
    }
    const sinal = tipo === 'baixa_venda' ? -1 : 1
    const { statements: movimento } = planejarMovimento(
      {
        estoqueItemId: linha.estoqueItemId,
        tipo,
        quantidade: sinal * Math.abs(linha.quantidade),
        origemTipo: 'comanda_item',
        origemId,
        userId,
      },
      saldoAnterior
    )
    statements.push(...movimento)
  }
  return statements
}

export const abrirComandaAction = garcomActionClient
  .schema(abrirComandaSchema)
  .action(async ({ parsedInput, ctx }) => {
    const jaAberta = await db.query.comanda.findFirst({
      where: (c, { eq: eqOp, and: andOp }) =>
        andOp(
          eqOp(c.organization_id, ctx.organizationId),
          eqOp(c.numero, parsedInput.numero),
          eqOp(c.status, 'aberta')
        ),
    })
    if (jaAberta) throw new ActionError('Essa comanda já está em uso.')

    let criada
    try {
      ;[criada] = await db
        .insert(comanda)
        .values({
          organization_id: ctx.organizationId,
          numero: parsedInput.numero,
          data: hojeISO(),
          mesa_label: parsedInput.mesaLabel?.trim() || null,
          aberto_por_user_id: ctx.user.id,
        })
        .returning({ id: comanda.id })
    } catch {
      throw new ActionError('Essa comanda já está em uso.')
    }
    if (!criada) throw new ActionError('Não foi possível abrir a comanda.')

    revalidarSalao()
    await notificarSalao(ctx.organizationId, 'comanda-aberta')
    return { comandaId: criada.id }
  })

export const lancarItemAction = garcomActionClient
  .schema(lancarItemSchema)
  .action(async ({ parsedInput, ctx }) => {
    await buscarComandaAberta(ctx.organizationId, parsedInput.comandaId)

    const produtoRow = await db.query.produto.findFirst({
      where: (p, { eq: eqOp, and: andOp }) =>
        andOp(eqOp(p.id, parsedInput.produtoId), eqOp(p.organization_id, ctx.organizationId)),
      with: { tamanhos: true },
    })
    if (!produtoRow) throw new ActionError('Produto não encontrado.')

    let precoVendaReais: number
    if (produtoRow.tem_tamanhos) {
      const tamanho = produtoRow.tamanhos.find((t) => t.id === parsedInput.produtoTamanhoId)
      if (!tamanho) throw new ActionError('Selecione o tamanho do produto.')
      precoVendaReais = Number(tamanho.preco_venda)
    } else {
      if (produtoRow.preco_venda == null) {
        throw new ActionError('Esse produto não tem preço de venda cadastrado.')
      }
      precoVendaReais = Number(produtoRow.preco_venda)
    }
    const precoUnitarioCentavos = Math.round(precoVendaReais * 100)

    const ficha = await getFichaTecnicaParaConsumo(
      ctx.organizationId,
      parsedInput.produtoId,
      parsedInput.produtoTamanhoId
    )
    if (!ficha) throw new ActionError('Produto não encontrado.')

    const itemId = createId()
    const consumo = calcularConsumoInsumos(
      ficha.fichaTecnica,
      ficha.overrides,
      parsedInput.quantidade,
      ficha.pesoGramas,
      ficha.pesoBaseGramas
    )
    const statementsEstoque = await planejarConsumo(
      ctx.organizationId,
      consumo,
      'baixa_venda',
      itemId,
      ctx.user.id
    )

    await executarLote([
      db.insert(comanda_item).values({
        id: itemId,
        comanda_id: parsedInput.comandaId,
        produto_id: parsedInput.produtoId,
        produto_tamanho_id: parsedInput.produtoTamanhoId ?? null,
        quantidade: toNumericString(parsedInput.quantidade),
        preco_unitario_centavos: precoUnitarioCentavos,
        observacao: parsedInput.observacao?.trim() || null,
        criado_por_user_id: ctx.user.id,
      }),
      ...statementsEstoque,
    ])

    revalidarSalao()
    revalidatePath('/estoque')
    await notificarSalao(ctx.organizationId, 'comanda-atualizada')
    return { itemId }
  })

export const editarItemAction = garcomActionClient
  .schema(editarItemSchema)
  .action(async ({ parsedInput, ctx }) => {
    const item = await db.query.comanda_item.findFirst({
      where: eq(comanda_item.id, parsedInput.comandaItemId),
      with: { comanda: true },
    })
    if (!item || item.comanda.organization_id !== ctx.organizationId) {
      throw new ActionError('Item não encontrado.')
    }
    if (item.comanda.status !== 'aberta') {
      throw new ActionError('Essa comanda não está mais aberta.')
    }
    if (item.excluido) throw new ActionError('Esse item já foi excluído.')

    const statements: Statement[] = []
    const quantidadeAtual = Number(item.quantidade)
    const novaQuantidade = parsedInput.quantidade ?? quantidadeAtual
    const deltaQuantidade = novaQuantidade - quantidadeAtual

    if (deltaQuantidade !== 0) {
      const ficha = await getFichaTecnicaParaConsumo(
        ctx.organizationId,
        item.produto_id,
        item.produto_tamanho_id ?? undefined
      )
      if (!ficha) throw new ActionError('Produto não encontrado.')

      const consumoDelta = calcularConsumoInsumos(
        ficha.fichaTecnica,
        ficha.overrides,
        Math.abs(deltaQuantidade),
        ficha.pesoGramas,
        ficha.pesoBaseGramas
      )
      const tipo = deltaQuantidade > 0 ? 'baixa_venda' : 'estorno_venda'
      statements.push(
        ...(await planejarConsumo(
          ctx.organizationId,
          consumoDelta,
          tipo,
          item.id,
          ctx.user.id
        ))
      )
    }

    statements.push(
      db
        .update(comanda_item)
        .set({
          ...(parsedInput.quantidade != null
            ? { quantidade: toNumericString(parsedInput.quantidade) }
            : {}),
          ...(parsedInput.observacao !== undefined
            ? { observacao: parsedInput.observacao.trim() || null }
            : {}),
        })
        .where(eq(comanda_item.id, item.id))
    )

    await executarLote(statements)

    revalidarSalao()
    revalidatePath('/estoque')
    await notificarSalao(ctx.organizationId, 'comanda-atualizada')
    return { itemId: item.id }
  })

export const excluirItemAction = garcomActionClient
  .schema(excluirItemSchema)
  .action(async ({ parsedInput, ctx }) => {
    const item = await db.query.comanda_item.findFirst({
      where: eq(comanda_item.id, parsedInput.comandaItemId),
      with: { comanda: true },
    })
    if (!item || item.comanda.organization_id !== ctx.organizationId) {
      throw new ActionError('Item não encontrado.')
    }
    if (item.comanda.status !== 'aberta') {
      throw new ActionError('Essa comanda não está mais aberta.')
    }
    if (item.excluido) throw new ActionError('Esse item já foi excluído.')

    const ficha = await getFichaTecnicaParaConsumo(
      ctx.organizationId,
      item.produto_id,
      item.produto_tamanho_id ?? undefined
    )
    const consumo = ficha
      ? calcularConsumoInsumos(
          ficha.fichaTecnica,
          ficha.overrides,
          Number(item.quantidade),
          ficha.pesoGramas,
          ficha.pesoBaseGramas
        )
      : []
    const statementsEstoque = await planejarConsumo(
      ctx.organizationId,
      consumo,
      'estorno_venda',
      item.id,
      ctx.user.id
    )

    await executarLote([
      db
        .update(comanda_item)
        .set({ excluido: true, excluido_em: new Date() })
        .where(eq(comanda_item.id, item.id)),
      ...statementsEstoque,
    ])

    revalidarSalao()
    revalidatePath('/estoque')
    await notificarSalao(ctx.organizationId, 'comanda-atualizada')
    return { itemId: item.id }
  })

/**
 * Marca como enviados e devolve os dados pra impressão client-side (QZ
 * Tray) — a action nunca imprime, só prepara o que precisa ser impresso.
 */
export const enviarCozinhaAction = garcomActionClient
  .schema(enviarCozinhaSchema)
  .action(async ({ parsedInput, ctx }) => {
    const comandaRow = await buscarComandaAberta(ctx.organizationId, parsedInput.comandaId)

    const pendentes = await db.query.comanda_item.findMany({
      where: (item, { eq: eqOp, and: andOp, isNull }) =>
        andOp(
          eqOp(item.comanda_id, parsedInput.comandaId),
          eqOp(item.excluido, false),
          isNull(item.enviado_cozinha_em)
        ),
      with: { produto: { columns: { nome: true } } },
    })

    if (pendentes.length > 0) {
      await db
        .update(comanda_item)
        .set({ enviado_cozinha_em: new Date() })
        .where(
          inArray(
            comanda_item.id,
            pendentes.map((p) => p.id)
          )
        )
      revalidarSalao()
      await notificarSalao(ctx.organizationId, 'comanda-atualizada')
    }

    return {
      numero: comandaRow.numero,
      mesaLabel: comandaRow.mesa_label,
      itens: pendentes.map((p) => ({
        produtoNome: p.produto.nome,
        quantidade: Number(p.quantidade),
        observacao: p.observacao,
      })),
    }
  })

export const registrarPagamentoAction = caixaActionClient
  .schema(registrarPagamentoSchema)
  .action(async ({ parsedInput, ctx }) => {
    const comandaRow = await db.query.comanda.findFirst({
      where: (c, { eq: eqOp, and: andOp }) =>
        andOp(
          eqOp(c.id, parsedInput.comandaId),
          eqOp(c.organization_id, ctx.organizationId)
        ),
      with: {
        itens: { where: (item, { eq: eqOp }) => eqOp(item.excluido, false) },
        pagamentos: true,
      },
    })
    if (!comandaRow) throw new ActionError('Comanda não encontrada.')
    if (comandaRow.status !== 'aberta') {
      throw new ActionError('Essa comanda não está mais aberta.')
    }

    const totalCentavos = somarCentavos(
      comandaRow.itens.map((item) =>
        Math.round(item.preco_unitario_centavos * Number(item.quantidade))
      )
    )
    const pagoAntes = somarCentavos(comandaRow.pagamentos.map((p) => p.valor_centavos))
    const saldoDevidoInicial = Math.max(0, totalCentavos - pagoAntes)

    let acumulado = 0
    let trocoCentavos = 0
    const statements: Statement[] = []

    for (const linha of parsedInput.pagamentos) {
      const restante = saldoDevidoInicial - acumulado
      let aplicado = linha.valorCentavos
      if (linha.forma === 'dinheiro' && linha.valorCentavos > restante) {
        aplicado = Math.max(0, restante)
        trocoCentavos += linha.valorCentavos - restante
      }
      if (aplicado <= 0) continue
      acumulado += aplicado
      statements.push(
        db.insert(comanda_pagamento).values({
          comanda_id: comandaRow.id,
          forma: linha.forma,
          valor_centavos: aplicado,
          criado_por_user_id: ctx.user.id,
        })
      )
    }

    const fechada = acumulado >= saldoDevidoInicial

    if (fechada) {
      statements.push(
        db
          .update(comanda)
          .set({ status: 'fechada', fechado_em: new Date() })
          .where(eq(comanda.id, comandaRow.id))
      )
      statements.push(
        db.insert(transacao_financeira).values({
          tipo: 'receita',
          origem: 'salao',
          valor: toMoneyString(centavosParaReais(totalCentavos)),
          data: hojeISO(),
          descricao: `Comanda #${comandaRow.numero}${comandaRow.mesa_label ? ` — ${comandaRow.mesa_label}` : ''}`,
          origem_tipo: 'comanda',
          origem_id: comandaRow.id,
          user_id: ctx.user.id,
        })
      )
    }

    await executarLote(statements)

    revalidarSalao()
    if (fechada) revalidatePath('/financeiro')
    await notificarSalao(ctx.organizationId, fechada ? 'comanda-fechada' : 'comanda-atualizada')

    return {
      fechada,
      trocoCentavos,
      saldoDevidoCentavos: Math.max(0, saldoDevidoInicial - acumulado),
    }
  })

export const cancelarComandaAction = caixaActionClient
  .schema(cancelarComandaSchema)
  .action(async ({ parsedInput, ctx }) => {
    const comandaRow = await db.query.comanda.findFirst({
      where: (c, { eq: eqOp, and: andOp }) =>
        andOp(
          eqOp(c.id, parsedInput.comandaId),
          eqOp(c.organization_id, ctx.organizationId)
        ),
      with: { itens: { where: (item, { eq: eqOp }) => eqOp(item.excluido, false) } },
    })
    if (!comandaRow) throw new ActionError('Comanda não encontrada.')
    if (comandaRow.status !== 'aberta') {
      throw new ActionError('Essa comanda não está mais aberta.')
    }

    const statements: Statement[] = [
      db
        .update(comanda)
        .set({
          status: 'cancelada',
          fechado_em: new Date(),
          observacao: parsedInput.motivo,
        })
        .where(eq(comanda.id, comandaRow.id)),
    ]

    for (const item of comandaRow.itens) {
      const ficha = await getFichaTecnicaParaConsumo(
        ctx.organizationId,
        item.produto_id,
        item.produto_tamanho_id ?? undefined
      )
      const consumo = ficha
        ? calcularConsumoInsumos(
            ficha.fichaTecnica,
            ficha.overrides,
            Number(item.quantidade),
            ficha.pesoGramas,
            ficha.pesoBaseGramas
          )
        : []
      statements.push(
        ...(await planejarConsumo(
          ctx.organizationId,
          consumo,
          'estorno_venda',
          item.id,
          ctx.user.id
        ))
      )
    }

    await executarLote(statements)

    revalidarSalao()
    revalidatePath('/estoque')
    await notificarSalao(ctx.organizationId, 'comanda-cancelada')
    return { comandaId: comandaRow.id }
  })

export const marcarNotaPendenteAction = caixaActionClient
  .schema(marcarNotaPendenteSchema)
  .action(async ({ parsedInput, ctx }) => {
    const atualizado = await db
      .update(comanda)
      .set({ nota_pendente: true, cliente_email: parsedInput.email })
      .where(
        and(
          eq(comanda.id, parsedInput.comandaId),
          eq(comanda.organization_id, ctx.organizationId)
        )
      )
      .returning({ id: comanda.id })

    if (atualizado.length === 0) throw new ActionError('Comanda não encontrada.')

    revalidarSalao()
    return { comandaId: parsedInput.comandaId }
  })
