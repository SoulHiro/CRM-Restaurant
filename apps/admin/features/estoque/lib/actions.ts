'use server'

import { revalidatePath } from 'next/cache'
import { and, eq } from 'drizzle-orm'

import { db } from '@/lib/db'
import { executarLote, type Statement } from '@/lib/db-batch'
import { hojeISO } from '@/lib/formatters'
import { toMoneyString, toNumber, toNumericString } from '@/lib/numeric'
import {
  ActionError,
  adminTenantActionClient,
  tenantActionClient,
} from '@/lib/safe-action'
import {
  estoque_item,
  historico_preco_insumo,
  inventario_fisico,
  inventario_fisico_item,
  perda_estoque,
} from '@repo/db'

import { lerSaldoAtual, planejarMovimento } from './aplicar-movimento'
import { calcularDiferenca } from './inventario-helpers'
import {
  ajustarQuantidadeSchema,
  createEstoqueItemSchema,
  finalizarInventarioSchema,
  iniciarInventarioSchema,
  registrarPerdaSchema,
  salvarContagemSchema,
  updateEstoqueItemSchema,
} from './schemas'

function revalidarEstoque(itemId?: string) {
  revalidatePath('/estoque')
  if (itemId) revalidatePath(`/estoque/${itemId}`)
}

export const createEstoqueItemAction = adminTenantActionClient
  .schema(createEstoqueItemSchema)
  .action(async ({ parsedInput, ctx }) => {
    const [criado] = await db
      .insert(estoque_item)
      .values({
        organization_id: ctx.organizationId,
        nome: parsedInput.nome.trim(),
        unidade: parsedInput.unidade,
        categoria: parsedInput.categoria,
        departamento_id: parsedInput.departamentoId?.trim() || null,
        quantidade_atual: toNumericString(0),
        tamanho_embalagem:
          parsedInput.tamanhoEmbalagem != null &&
          parsedInput.tamanhoEmbalagem > 0
            ? toNumericString(parsedInput.tamanhoEmbalagem)
            : null,
        ponto_reposicao: toNumericString(parsedInput.pontoReposicao),
        validade: parsedInput.validade ?? null,
      })
      .returning({ id: estoque_item.id })

    if (!criado) throw new ActionError('Não foi possível cadastrar o item')

    if (parsedInput.quantidadeAtual > 0) {
      const { statements } = planejarMovimento({
        estoqueItemId: criado.id,
        tipo: 'ajuste_manual',
        quantidade: parsedInput.quantidadeAtual,
        observacao: 'Quantidade inicial do cadastro',
        userId: ctx.user.id,
      })
      await executarLote(statements)
    }

    if (parsedInput.preco != null && parsedInput.preco > 0) {
      await db.insert(historico_preco_insumo).values({
        estoque_item_id: criado.id,
        preco: toMoneyString(parsedInput.preco),
        data_vigencia: hojeISO(),
      })
    }

    revalidarEstoque(criado.id)
    return { itemId: criado.id }
  })

export const updateEstoqueItemAction = adminTenantActionClient
  .schema(updateEstoqueItemSchema)
  .action(async ({ parsedInput, ctx }) => {
    const statements: Statement[] = [
      db
        .update(estoque_item)
        .set({
          nome: parsedInput.nome.trim(),
          unidade: parsedInput.unidade,
          categoria: parsedInput.categoria,
          departamento_id: parsedInput.departamentoId?.trim() || null,
          tamanho_embalagem:
            parsedInput.tamanhoEmbalagem != null &&
            parsedInput.tamanhoEmbalagem > 0
              ? toNumericString(parsedInput.tamanhoEmbalagem)
              : null,
          ponto_reposicao: toNumericString(parsedInput.pontoReposicao),
          validade: parsedInput.validade ?? null,
          fornecedor_padrao_id: parsedInput.fornecedorPadraoId?.trim() || null,
        })
        .where(
          and(
            eq(estoque_item.id, parsedInput.id),
            eq(estoque_item.organization_id, ctx.organizationId)
          )
        ),
    ]

    // Preço novo não edita o histórico — sempre entra como linha nova.
    if (parsedInput.novoPreco != null && parsedInput.novoPreco > 0) {
      statements.push(
        db.insert(historico_preco_insumo).values({
          estoque_item_id: parsedInput.id,
          preco: parsedInput.novoPreco.toFixed(2),
          data_vigencia: parsedInput.precoDataVigencia?.trim() || hojeISO(),
        })
      )
    }

    await executarLote(statements)

    revalidarEstoque(parsedInput.id)
    return { itemId: parsedInput.id }
  })

export const ajustarQuantidadeAction = tenantActionClient
  .schema(ajustarQuantidadeSchema)
  .action(async ({ parsedInput, ctx }) => {
    const saldoAtual = await lerSaldoAtual(
      ctx.organizationId,
      parsedInput.estoqueItemId
    )
    if (saldoAtual == null) throw new ActionError('Item não encontrado')

    const diferenca =
      Math.round((parsedInput.quantidadeCorreta - saldoAtual) * 1000) / 1000

    if (diferenca === 0) {
      return { estoqueItemId: parsedInput.estoqueItemId, ajustado: false }
    }

    const observacao =
      parsedInput.observacao?.trim() || 'Correção de quantidade em estoque'

    const { statements } = planejarMovimento({
      estoqueItemId: parsedInput.estoqueItemId,
      tipo: 'ajuste_manual',
      quantidade: diferenca,
      observacao,
      userId: ctx.user.id,
    })
    await executarLote(statements)

    revalidarEstoque(parsedInput.estoqueItemId)
    return { estoqueItemId: parsedInput.estoqueItemId, ajustado: true }
  })

export const registrarPerdaAction = tenantActionClient
  .schema(registrarPerdaSchema)
  .action(async ({ parsedInput, ctx }) => {
    const saldoAtual = await lerSaldoAtual(
      ctx.organizationId,
      parsedInput.estoqueItemId
    )
    if (saldoAtual == null) throw new ActionError('Item não encontrado')

    const observacao = parsedInput.observacao?.trim() || undefined

    const [perda] = await db
      .insert(perda_estoque)
      .values({
        estoque_item_id: parsedInput.estoqueItemId,
        quantidade: toNumericString(parsedInput.quantidade),
        motivo: parsedInput.motivo,
        data: parsedInput.data,
        responsavel: ctx.user.name,
        user_id: ctx.user.id,
        observacao: observacao ?? null,
      })
      .returning({ id: perda_estoque.id })

    if (!perda) throw new ActionError('Não foi possível registrar a perda')

    const { statements } = planejarMovimento({
      estoqueItemId: parsedInput.estoqueItemId,
      tipo: 'perda',
      quantidade: -parsedInput.quantidade,
      origemTipo: 'perda',
      origemId: perda.id,
      observacao,
      userId: ctx.user.id,
    })
    await executarLote(statements)

    revalidarEstoque(parsedInput.estoqueItemId)
    return { perdaId: perda.id }
  })

const TIPO_LABEL: Record<'abertura' | 'fechamento', string> = {
  abertura: 'Abertura',
  fechamento: 'Fechamento',
}

export const iniciarInventarioAction = tenantActionClient
  .schema(iniciarInventarioSchema)
  .action(async ({ parsedInput, ctx }) => {
    const hoje = hojeISO()

    const existente = await db.query.inventario_fisico.findFirst({
      where: (inventario, { and: andOp }) =>
        andOp(
          eq(inventario.data, hoje),
          eq(inventario.tipo, parsedInput.tipo),
          eq(inventario.organization_id, ctx.organizationId)
        ),
      columns: { id: true, status: true },
    })

    if (existente) {
      if (existente.status === 'finalizado') {
        throw new ActionError(
          `${TIPO_LABEL[parsedInput.tipo]} de hoje já foi finalizada.`
        )
      }
      return { inventarioId: existente.id }
    }

    const itens = await db
      .select({
        id: estoque_item.id,
        quantidade: estoque_item.quantidade_atual,
      })
      .from(estoque_item)
      .where(
        and(
          eq(estoque_item.ativo, true),
          eq(estoque_item.organization_id, ctx.organizationId)
        )
      )

    if (itens.length === 0) {
      throw new ActionError(
        'Cadastre pelo menos um item antes de abrir a contagem.'
      )
    }

    const [inventario] = await db
      .insert(inventario_fisico)
      .values({
        organization_id: ctx.organizationId,
        data: hoje,
        tipo: parsedInput.tipo,
        responsavel: ctx.user.name,
      })
      .returning({ id: inventario_fisico.id })

    if (!inventario) throw new ActionError('Não foi possível abrir a contagem')

    await db.insert(inventario_fisico_item).values(
      itens.map((item) => ({
        inventario_id: inventario.id,
        estoque_item_id: item.id,
        quantidade_sistema: item.quantidade,
      }))
    )

    revalidatePath('/estoque/inventario')
    return { inventarioId: inventario.id }
  })

export const salvarContagemAction = tenantActionClient
  .schema(salvarContagemSchema)
  .action(async ({ parsedInput, ctx }) => {
    const linha = await db.query.inventario_fisico_item.findFirst({
      where: eq(inventario_fisico_item.id, parsedInput.linhaId),
      with: { inventario: { columns: { status: true, organization_id: true } } },
    })

    if (!linha || linha.inventario.organization_id !== ctx.organizationId) {
      throw new ActionError('Linha de contagem não encontrada')
    }
    if (linha.inventario.status === 'finalizado') {
      throw new ActionError('Essa contagem já foi finalizada.')
    }

    const contada = parsedInput.quantidadeContada

    await db
      .update(inventario_fisico_item)
      .set({
        quantidade_contada: contada == null ? null : toNumericString(contada),
        diferenca:
          contada == null
            ? null
            : toNumericString(
                calcularDiferenca(contada, toNumber(linha.quantidade_sistema))
              ),
      })
      .where(eq(inventario_fisico_item.id, parsedInput.linhaId))

    revalidatePath(`/estoque/inventario/${parsedInput.inventarioId}`)
    return { linhaId: parsedInput.linhaId }
  })

export const finalizarInventarioAction = tenantActionClient
  .schema(finalizarInventarioSchema)
  .action(async ({ parsedInput, ctx }) => {
    const inventario = await db.query.inventario_fisico.findFirst({
      where: eq(inventario_fisico.id, parsedInput.id),
      with: {
        linhas: { with: { item: { columns: { quantidade_atual: true } } } },
      },
    })

    if (!inventario || inventario.organization_id !== ctx.organizationId) {
      throw new ActionError('Contagem não encontrada')
    }
    if (inventario.status === 'finalizado') {
      throw new ActionError('Essa contagem já foi finalizada.')
    }

    const paraAjustar = inventario.linhas.filter(
      (linha) =>
        linha.quantidade_contada != null && toNumber(linha.diferenca) !== 0
    )

    // O ajuste leva o saldo ao que foi contado, medindo contra o saldo do
    // momento da finalização — não contra o snapshot da abertura, porque o item
    // pode ter recebido perda durante a conferência.
    const statements: Statement[] = paraAjustar.flatMap((linha) => {
      const saldoAtual = toNumber(linha.item.quantidade_atual)
      const contada = toNumber(linha.quantidade_contada)

      return planejarMovimento({
        estoqueItemId: linha.estoque_item_id,
        tipo: 'ajuste_inventario',
        quantidade: contada - saldoAtual,
        origemTipo: 'inventario',
        origemId: inventario.id,
        observacao: `Contagem de ${inventario.data}`,
        userId: ctx.user.id,
      }).statements
    })

    statements.push(
      db
        .update(inventario_fisico)
        .set({ status: 'finalizado', finalizado_em: new Date() })
        .where(eq(inventario_fisico.id, inventario.id))
    )

    await executarLote(statements)

    revalidatePath('/estoque')
    revalidatePath('/estoque/inventario')
    revalidatePath(`/estoque/inventario/${inventario.id}`)
    return { inventarioId: inventario.id, itensAjustados: paraAjustar.length }
  })
