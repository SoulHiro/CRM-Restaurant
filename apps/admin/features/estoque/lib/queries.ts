import 'server-only'

import { count, desc, eq } from 'drizzle-orm'

import { db } from '@/lib/db'
import { hojeISO } from '@/lib/formatters'
import {
  estoque_item,
  historico_preco_insumo,
  inventario_fisico,
  perda_estoque,
} from '@repo/db'

import { toNumber } from '@/lib/numeric'
import { selecionarAlertas } from './estoque-helpers'
import type {
  AlertasEstoque,
  EstoqueItem,
  EstoqueItemDetalhe,
  EstoqueMovimento,
  InventarioDetalhe,
  InventarioResumo,
  PerdaEstoque,
  PrecoInsumo,
  Unidade,
} from './types'

type ItemRow = typeof estoque_item.$inferSelect
type FornecedorRef = { nome: string } | null

function mapItem(
  row: ItemRow & { fornecedorPadrao?: FornecedorRef }
): EstoqueItem {
  return {
    id: row.id,
    nome: row.nome,
    unidade: row.unidade,
    quantidadeAtual: toNumber(row.quantidade_atual),
    pontoReposicao: toNumber(row.ponto_reposicao),
    tamanhoEmbalagem:
      row.tamanho_embalagem == null ? null : toNumber(row.tamanho_embalagem),
    validade: row.validade,
    fornecedorPadraoId: row.fornecedor_padrao_id,
    fornecedorPadraoNome: row.fornecedorPadrao?.nome ?? null,
    ativo: row.ativo,
    criadoEm: row.created_at.toISOString(),
  }
}

export async function getEstoqueItens(): Promise<EstoqueItem[]> {
  const rows = await db.query.estoque_item.findMany({
    with: { fornecedorPadrao: { columns: { nome: true } } },
    orderBy: (item, { asc }) => [asc(item.nome)],
  })

  return rows.map(mapItem)
}

export async function getEstoqueItemById(
  id: string
): Promise<EstoqueItem | null> {
  const row = await db.query.estoque_item.findFirst({
    where: eq(estoque_item.id, id),
    with: { fornecedorPadrao: { columns: { nome: true } } },
  })

  return row ? mapItem(row) : null
}

/**
 * Itens elegíveis a receber perda ou entrar num inventário: só os ativos.
 * Um item desativado preserva histórico mas não aceita movimento novo.
 */
export async function getEstoqueItensAtivos(): Promise<EstoqueItem[]> {
  const rows = await db.query.estoque_item.findMany({
    where: eq(estoque_item.ativo, true),
    with: { fornecedorPadrao: { columns: { nome: true } } },
    orderBy: (item, { asc }) => [asc(item.nome)],
  })

  return rows.map(mapItem)
}

export async function getAlertasEstoque(): Promise<AlertasEstoque> {
  const itens = await getEstoqueItens()
  return selecionarAlertas(itens, hojeISO())
}

export async function getEstoqueItemDetalhe(
  id: string
): Promise<EstoqueItemDetalhe | null> {
  const row = await db.query.estoque_item.findFirst({
    where: eq(estoque_item.id, id),
    with: {
      fornecedorPadrao: { columns: { nome: true } },
      movimentos: {
        orderBy: (movimento, { desc: descOrder }) => [
          descOrder(movimento.created_at),
        ],
        limit: 100,
        with: { usuario: { columns: { name: true } } },
      },
      perdas: {
        orderBy: (perda, { desc: descOrder }) => [descOrder(perda.data)],
      },
      precos: {
        orderBy: (preco, { desc: descOrder }) => [
          descOrder(preco.data_vigencia),
        ],
        with: { fornecedor: { columns: { nome: true } } },
      },
    },
  })

  if (!row) return null

  const item = mapItem(row)

  const movimentos: EstoqueMovimento[] = row.movimentos.map((movimento) => ({
    id: movimento.id,
    tipo: movimento.tipo,
    quantidade: toNumber(movimento.quantidade),
    quantidadeResultante: toNumber(movimento.saldo_resultante),
    observacao: movimento.observacao,
    responsavel: movimento.usuario?.name ?? null,
    criadoEm: movimento.created_at.toISOString(),
  }))

  const perdas: PerdaEstoque[] = row.perdas.map((perda) => ({
    id: perda.id,
    itemId: item.id,
    itemNome: item.nome,
    unidade: item.unidade,
    quantidade: toNumber(perda.quantidade),
    motivo: perda.motivo,
    data: perda.data,
    responsavel: perda.responsavel,
    observacao: perda.observacao,
  }))

  const precos: PrecoInsumo[] = row.precos.map((preco) => ({
    id: preco.id,
    preco: toNumber(preco.preco),
    dataVigencia: preco.data_vigencia,
    fornecedorNome: preco.fornecedor?.nome ?? null,
  }))

  return { item, movimentos, perdas, precos }
}

export async function getPerdasRecentes(
  limite = 50
): Promise<PerdaEstoque[]> {
  const rows = await db
    .select({
      id: perda_estoque.id,
      itemId: estoque_item.id,
      itemNome: estoque_item.nome,
      unidade: estoque_item.unidade,
      quantidade: perda_estoque.quantidade,
      motivo: perda_estoque.motivo,
      data: perda_estoque.data,
      responsavel: perda_estoque.responsavel,
      observacao: perda_estoque.observacao,
    })
    .from(perda_estoque)
    .innerJoin(estoque_item, eq(perda_estoque.estoque_item_id, estoque_item.id))
    .orderBy(desc(perda_estoque.data), desc(perda_estoque.created_at))
    .limit(limite)

  return rows.map((row) => ({
    ...row,
    unidade: row.unidade as Unidade,
    quantidade: toNumber(row.quantidade),
  }))
}

export async function getPrecoAtual(
  estoqueItemId: string
): Promise<PrecoInsumo | null> {
  const [row] = await db
    .select()
    .from(historico_preco_insumo)
    .where(eq(historico_preco_insumo.estoque_item_id, estoqueItemId))
    .orderBy(desc(historico_preco_insumo.data_vigencia))
    .limit(1)

  if (!row) return null

  return {
    id: row.id,
    preco: toNumber(row.preco),
    dataVigencia: row.data_vigencia,
    fornecedorNome: null,
  }
}

function resumirInventario(row: {
  id: string
  data: string
  responsavel: string
  status: 'em_andamento' | 'finalizado'
  observacao: string | null
  finalizado_em: Date | null
  linhas: { quantidade_contada: string | null; diferenca: string | null }[]
}): InventarioResumo {
  const contadas = row.linhas.filter(
    (linha) => linha.quantidade_contada != null
  )

  return {
    id: row.id,
    data: row.data,
    responsavel: row.responsavel,
    status: row.status,
    observacao: row.observacao,
    totalLinhas: row.linhas.length,
    linhasContadas: contadas.length,
    linhasDivergentes: contadas.filter(
      (linha) => toNumber(linha.diferenca) !== 0
    ).length,
    finalizadoEm: row.finalizado_em?.toISOString() ?? null,
  }
}

export async function getInventarios(): Promise<InventarioResumo[]> {
  const rows = await db.query.inventario_fisico.findMany({
    with: {
      linhas: { columns: { quantidade_contada: true, diferenca: true } },
    },
    orderBy: (inventario, { desc: descOrder }) => [
      descOrder(inventario.data),
      descOrder(inventario.created_at),
    ],
  })

  return rows.map(resumirInventario)
}

export async function getInventarioEmAndamento(): Promise<InventarioResumo | null> {
  const row = await db.query.inventario_fisico.findFirst({
    where: eq(inventario_fisico.status, 'em_andamento'),
    with: {
      linhas: { columns: { quantidade_contada: true, diferenca: true } },
    },
  })

  return row ? resumirInventario(row) : null
}

export async function getInventarioDetalhe(
  id: string
): Promise<InventarioDetalhe | null> {
  const row = await db.query.inventario_fisico.findFirst({
    where: eq(inventario_fisico.id, id),
    with: {
      linhas: {
        with: {
          item: { columns: { id: true, nome: true, unidade: true } },
        },
      },
    },
  })

  if (!row) return null

  const linhas = row.linhas
    .map((linha) => ({
      id: linha.id,
      itemId: linha.item.id,
      itemNome: linha.item.nome,
      unidade: linha.item.unidade,
      quantidadeSistema: toNumber(linha.quantidade_sistema),
      quantidadeContada:
        linha.quantidade_contada == null
          ? null
          : toNumber(linha.quantidade_contada),
      diferenca: linha.diferenca == null ? null : toNumber(linha.diferenca),
    }))
    .sort((a, b) => a.itemNome.localeCompare(b.itemNome, 'pt-BR'))

  return { resumo: resumirInventario(row), linhas }
}

export async function contarItensAtivos(): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(estoque_item)
    .where(eq(estoque_item.ativo, true))

  return row?.total ?? 0
}
