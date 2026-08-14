import 'server-only'

import { desc, eq } from 'drizzle-orm'

import { hojeISO } from '@/lib/formatters'
import { db } from '@/lib/db'
import { toNumber } from '@/lib/numeric'
import {
  avaliacao_fornecedor,
  compra,
  compra_item,
  fornecedor,
  fornecedor_item,
} from '@repo/db'

import { getUltimosPrecos } from '@/features/estoque/lib/queries'

import { entregaAtrasada, totalCompra, totalLinha } from './compra-helpers'
import { mediaAvaliacao } from './fornecedor-helpers'
import { agruparPorFornecedor, montarSugestao } from './sugestao-helpers'
import type {
  AvaliacaoFornecedor,
  CompraDetalhe,
  CompraLinha,
  CompraListItem,
  CompraNaLista,
  FornecedorDetalhe,
  FornecedorItemPreco,
  FornecedorListItem,
  SugestaoGrupo,
} from './types'

const COM_LINHAS = {
  fornecedor: {
    columns: { nome: true, prazo_entrega_dias: true },
  },
  itens: {
    with: { item: { columns: { nome: true, unidade: true } } },
  },
} as const

type CompraRow = typeof compra.$inferSelect & {
  fornecedor: { nome: string; prazo_entrega_dias: number | null }
  itens: (typeof compra_item.$inferSelect & {
    item: { nome: string; unidade: CompraLinha['unidade'] }
  })[]
}

function mapLinhas(row: CompraRow): CompraLinha[] {
  return row.itens
    .map((linha) => {
      const quantidade = toNumber(linha.quantidade)
      const valorUnitario = toNumber(linha.valor_unitario)
      return {
        id: linha.id,
        estoqueItemId: linha.estoque_item_id,
        itemNome: linha.item.nome,
        unidade: linha.item.unidade,
        quantidade,
        valorUnitario,
        total: totalLinha({ quantidade, valorUnitario }),
      }
    })
    .sort((a, b) => a.itemNome.localeCompare(b.itemNome, 'pt-BR'))
}

function mapCompra(row: CompraRow, hoje: string): CompraListItem {
  const linhas = mapLinhas(row)

  return {
    id: row.id,
    fornecedorId: row.fornecedor_id,
    fornecedorNome: row.fornecedor.nome,
    numeroNotaFiscal: row.numero_nota_fiscal,
    categoriaDespesa: row.categoria_despesa,
    status: row.status,
    dataPedido: row.data_pedido,
    dataRecebimento: row.data_recebimento,
    total: totalCompra(linhas),
    qtdItens: linhas.length,
    entregaAtrasada: entregaAtrasada(
      {
        status: row.status,
        dataPedido: row.data_pedido,
        prazoEntregaDias: row.fornecedor.prazo_entrega_dias,
      },
      hoje
    ),
  }
}

function mapCompraNaLista(row: CompraRow, hoje: string): CompraNaLista {
  return {
    ...mapCompra(row, hoje),
    formaPagamento: row.forma_pagamento,
    observacao: row.observacao,
    linhas: mapLinhas(row),
  }
}

export async function getCompras(): Promise<CompraNaLista[]> {
  const hoje = hojeISO()
  const rows = await db.query.compra.findMany({
    with: COM_LINHAS,
    orderBy: (c, { desc: descOrder }) => [
      descOrder(c.data_pedido),
      descOrder(c.created_at),
    ],
    limit: 200,
  })

  return rows.map((row) => mapCompraNaLista(row as CompraRow, hoje))
}

export async function getCompraDetalhe(
  id: string
): Promise<CompraDetalhe | null> {
  const row = await db.query.compra.findFirst({
    where: eq(compra.id, id),
    with: COM_LINHAS,
  })

  if (!row) return null

  const conta = await db.query.conta_a_pagar.findFirst({
    where: (c, { and, eq: igual }) =>
      and(igual(c.origem_tipo, 'compra'), igual(c.origem_id, id)),
    columns: { id: true, status: true },
  })

  return {
    ...mapCompraNaLista(row as CompraRow, hojeISO()),
    criadoEm: row.created_at.toISOString(),
    contaPagarId: conta?.id ?? null,
    contaPagarPaga: conta?.status === 'pago',
  }
}

export async function getFornecedores(): Promise<FornecedorListItem[]> {
  const rows = await db.query.fornecedor.findMany({
    with: {
      avaliacoes: { columns: { nota: true } },
      itensFornecidos: { columns: { id: true } },
      compras: { columns: { id: true } },
    },
    orderBy: (f, { asc }) => [asc(f.nome)],
  })

  return rows.map((row) => ({
    id: row.id,
    nome: row.nome,
    contato: row.contato,
    prazoEntregaDias: row.prazo_entrega_dias,
    prazoPagamento: row.prazo_pagamento,
    qtdItens: row.itensFornecidos.length,
    qtdCompras: row.compras.length,
    mediaAvaliacao: mediaAvaliacao(row.avaliacoes),
  }))
}

export async function getFornecedorDetalhe(
  id: string
): Promise<FornecedorDetalhe | null> {
  const row = await db.query.fornecedor.findFirst({
    where: eq(fornecedor.id, id),
    with: {
      itensFornecidos: {
        with: { item: { columns: { nome: true, unidade: true } } },
      },
      avaliacoes: {
        orderBy: (a, { desc: descOrder }) => [descOrder(a.data)],
        with: { usuario: { columns: { name: true } } },
      },
    },
  })

  if (!row) return null

  const hoje = hojeISO()
  const comprasRows = await db.query.compra.findMany({
    where: eq(compra.fornecedor_id, id),
    with: COM_LINHAS,
    orderBy: (c, { desc: descOrder }) => [descOrder(c.data_pedido)],
    limit: 50,
  })

  const itens: FornecedorItemPreco[] = row.itensFornecidos
    .map((oferta) => ({
      id: oferta.id,
      fornecedorId: row.id,
      fornecedorNome: row.nome,
      estoqueItemId: oferta.estoque_item_id,
      itemNome: oferta.item.nome,
      unidade: oferta.item.unidade,
      preco: toNumber(oferta.preco),
      prazoEntregaDias: oferta.prazo_entrega_dias,
      observacao: oferta.observacao,
    }))
    .sort((a, b) => a.itemNome.localeCompare(b.itemNome, 'pt-BR'))

  const avaliacoes: AvaliacaoFornecedor[] = row.avaliacoes.map((a) => ({
    id: a.id,
    data: a.data,
    nota: a.nota,
    tipo: a.tipo,
    observacao: a.observacao,
    responsavel: a.usuario?.name ?? null,
  }))

  return {
    id: row.id,
    nome: row.nome,
    contato: row.contato,
    prazoEntregaDias: row.prazo_entrega_dias,
    prazoPagamento: row.prazo_pagamento,
    qtdItens: itens.length,
    qtdCompras: comprasRows.length,
    mediaAvaliacao: mediaAvaliacao(avaliacoes),
    criadoEm: row.created_at.toISOString(),
    itens,
    avaliacoes,
    compras: comprasRows.map((c) => mapCompra(c as CompraRow, hoje)),
  }
}

export async function getSugestaoCompra(): Promise<SugestaoGrupo[]> {
  const itens = await db.query.estoque_item.findMany({
    where: (item, { eq: igual }) => igual(item.ativo, true),
    with: { fornecedorPadrao: { columns: { nome: true } } },
  })

  const precos = await getUltimosPrecos(itens.map((item) => item.id))

  const sugeridos = montarSugestao(
    itens.map((item) => ({
      estoqueItemId: item.id,
      nome: item.nome,
      unidade: item.unidade,
      tamanhoEmbalagem:
        item.tamanho_embalagem == null
          ? null
          : toNumber(item.tamanho_embalagem),
      quantidadeAtual: toNumber(item.quantidade_atual),
      pontoReposicao: toNumber(item.ponto_reposicao),
      ultimoPreco: precos.get(item.id) ?? null,
      fornecedorId: item.fornecedor_padrao_id,
      fornecedorNome: item.fornecedorPadrao?.nome ?? null,
    }))
  )

  return agruparPorFornecedor(sugeridos)
}

/** Ofertas de todos os fornecedores para um item — base da comparação de preço. */
export async function getOfertasDoItem(
  estoqueItemId: string
): Promise<FornecedorItemPreco[]> {
  const rows = await db.query.fornecedor_item.findMany({
    where: eq(fornecedor_item.estoque_item_id, estoqueItemId),
    with: {
      fornecedor: { columns: { nome: true } },
      item: { columns: { nome: true, unidade: true } },
    },
  })

  return rows.map((row) => ({
    id: row.id,
    fornecedorId: row.fornecedor_id,
    fornecedorNome: row.fornecedor.nome,
    estoqueItemId: row.estoque_item_id,
    itemNome: row.item.nome,
    unidade: row.item.unidade,
    preco: toNumber(row.preco),
    prazoEntregaDias: row.prazo_entrega_dias,
    observacao: row.observacao,
  }))
}

/**
 * Preço que cada fornecedor cobra por item, achatado em `fornecedorId:itemId`.
 * O editor de linhas usa isso para já preencher o valor unitário quando o item
 * é escolhido — é a diferença entre digitar 3 campos e digitar 1.
 */
export async function getPrecosPorFornecedor(): Promise<
  Record<string, number>
> {
  const rows = await db
    .select({
      fornecedorId: fornecedor_item.fornecedor_id,
      estoqueItemId: fornecedor_item.estoque_item_id,
      preco: fornecedor_item.preco,
    })
    .from(fornecedor_item)

  return Object.fromEntries(
    rows.map((row) => [
      `${row.fornecedorId}:${row.estoqueItemId}`,
      toNumber(row.preco),
    ])
  )
}

export async function getAvaliacoesRecentes(
  limite = 20
): Promise<(AvaliacaoFornecedor & { fornecedorNome: string })[]> {
  const rows = await db.query.avaliacao_fornecedor.findMany({
    with: {
      fornecedor: { columns: { nome: true } },
      usuario: { columns: { name: true } },
    },
    orderBy: [desc(avaliacao_fornecedor.data)],
    limit: limite,
  })

  return rows.map((row) => ({
    id: row.id,
    data: row.data,
    nota: row.nota,
    tipo: row.tipo,
    observacao: row.observacao,
    responsavel: row.usuario?.name ?? null,
    fornecedorNome: row.fornecedor.nome,
  }))
}
