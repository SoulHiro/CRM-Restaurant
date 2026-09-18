import 'server-only'

import { eq, sql } from 'drizzle-orm'

import { db } from '@/lib/db'
import { hojeISO } from '@/lib/formatters'
import { toNumber } from '@/lib/numeric'
import {
  getEstoqueItensAtivos,
  getUltimosPrecos,
} from '@/features/estoque/lib/queries'
import { produto, produto_ficha_tecnica_item } from '@repo/db'

import type {
  CategoriaProdutoOption,
  EditarProdutoInput,
  InsumoOption,
  ProdutoListItem,
} from './types'

const CATEGORIAS_FICHA_TECNICA = ['comestivel', 'preparo', 'embalagem'] as const

/** `estoque_item_id → em quantas fichas técnicas (deste estabelecimento) aparece` — só pra ordenar a busca por mais usado primeiro. */
async function getContagemUsoInsumos(
  organizationId: string
): Promise<Map<string, number>> {
  const linhas = await db
    .select({
      estoqueItemId: produto_ficha_tecnica_item.estoque_item_id,
      total: sql<string>`count(*)`,
    })
    .from(produto_ficha_tecnica_item)
    .innerJoin(produto, eq(produto.id, produto_ficha_tecnica_item.produto_id))
    .where(eq(produto.organization_id, organizationId))
    .groupBy(produto_ficha_tecnica_item.estoque_item_id)

  return new Map(linhas.map((linha) => [linha.estoqueItemId, Number(linha.total)]))
}

export async function getInsumosDisponiveis(
  organizationId: string
): Promise<InsumoOption[]> {
  const itens = await getEstoqueItensAtivos(organizationId)
  const elegiveis = itens.filter((item) =>
    (CATEGORIAS_FICHA_TECNICA as readonly string[]).includes(item.categoria)
  )
  const [precos, vezesUsado] = await Promise.all([
    getUltimosPrecos(
      organizationId,
      elegiveis.map((item) => item.id)
    ),
    getContagemUsoInsumos(organizationId),
  ])

  return elegiveis.map((item) => ({
    id: item.id,
    nome: item.nome,
    unidade: item.unidade,
    categoria: item.categoria,
    custoUnitario: precos.get(item.id) ?? 0,
    vezesUsado: vezesUsado.get(item.id) ?? 0,
  }))
}

export async function getCategoriasProduto(
  organizationId: string
): Promise<CategoriaProdutoOption[]> {
  const rows = await db.query.categoria_produto.findMany({
    where: (categoria, { eq: eqOp }) =>
      eqOp(categoria.organization_id, organizationId),
    orderBy: (categoria, { asc }) => [
      asc(categoria.ordem),
      asc(categoria.nome),
    ],
  })

  return rows.map((row) => ({ id: row.id, nome: row.nome }))
}

export async function getProdutos(
  organizationId: string
): Promise<ProdutoListItem[]> {
  const hoje = hojeISO()

  const rows = await db.query.produto.findMany({
    where: (produto, { eq: eqOp }) =>
      eqOp(produto.organization_id, organizationId),
    with: {
      categoria: { columns: { nome: true } },
      tamanhos: { columns: { preco_venda: true } },
    },
    orderBy: (produto, { asc }) => [asc(produto.nome)],
  })

  return rows.map((row) => {
    const precosTamanhos = row.tamanhos.map((t) => toNumber(t.preco_venda))
    return {
      id: row.id,
      nome: row.nome,
      categoriaId: row.categoria_id,
      categoriaNome: row.categoria?.nome ?? null,
      tipo: row.tipo,
      precoVenda: row.preco_venda == null ? null : toNumber(row.preco_venda),
      temTamanhos: row.tem_tamanhos,
      precoMinimo: precosTamanhos.length > 0 ? Math.min(...precosTamanhos) : null,
      pausadoHoje: row.pausado_em === hoje,
      fotoUrl: row.foto_url,
      ativo: row.ativo,
    }
  })
}

/** Produto completo pra tela de edição — mesma forma que o form de cadastro usa, com id. */
export async function getProdutoDetalhe(
  organizationId: string,
  id: string
): Promise<EditarProdutoInput | null> {
  const row = await db.query.produto.findFirst({
    where: (produto, { eq: eqOp, and: andOp }) =>
      andOp(eqOp(produto.id, id), eqOp(produto.organization_id, organizationId)),
    with: {
      fichaTecnica: { with: { insumo: true } },
      tamanhos: { orderBy: (t, { asc }) => [asc(t.ordem)] },
    },
  })

  if (!row) return null

  const precos = await getUltimosPrecos(
    organizationId,
    row.fichaTecnica.map((item) => item.estoque_item_id)
  )

  const overridesPorLinha = await db.query.produto_ficha_tecnica_tamanho_override.findMany({
    where: (override, { inArray }) =>
      inArray(
        override.ficha_tecnica_item_id,
        row.fichaTecnica.map((item) => item.id)
      ),
  })

  return {
    id: row.id,
    nome: row.nome,
    categoriaId: row.categoria_id,
    tipo: row.tipo,
    fotoUrl: row.foto_url ?? '',
    fichaTecnica: row.fichaTecnica.map((item) => ({
      estoqueItemId: item.estoque_item_id,
      nome: item.insumo.nome,
      unidade: item.insumo.unidade,
      quantidade: toNumber(item.quantidade),
      custoUnitario: precos.get(item.estoque_item_id) ?? 0,
      tipoEscala: item.tipo_escala,
      overridesPorTamanho: overridesPorLinha
        .filter((o) => o.ficha_tecnica_item_id === item.id)
        .map((o) => ({
          tamanhoKey: o.produto_tamanho_id,
          estoqueItemId: o.estoque_item_id,
          quantidade: toNumber(o.quantidade),
        })),
    })),
    tempoMedioPreparoMinutos: row.tempo_medio_preparo_minutos ?? 0,
    temTamanhos: row.tem_tamanhos,
    tamanhos: row.tamanhos.map((t) => ({
      key: t.id,
      nome: t.nome,
      pesoGramas: t.peso_gramas,
      precoVenda: toNumber(t.preco_venda),
      ehBase: t.is_base,
    })),
    precoVenda: row.preco_venda == null ? 0 : toNumber(row.preco_venda),
    pausadoHoje: row.pausado_em === hojeISO(),
  }
}

/**
 * Verifica que todo `estoqueItemId` recebido do formulário pertence mesmo a
 * este estabelecimento, antes de gravar a ficha técnica — sem isso um bug
 * (ou um id adulterado) poderia vincular a receita de um produto a um
 * insumo de outro tenant.
 */
export async function todosInsumosPertencemAoTenant(
  organizationId: string,
  estoqueItemIds: readonly string[]
): Promise<boolean> {
  if (estoqueItemIds.length === 0) return true
  const unicos = [...new Set(estoqueItemIds)]
  const rows = await db.query.estoque_item.findMany({
    where: (item, { and: andOp, eq: eqOp, inArray }) =>
      andOp(
        inArray(item.id, unicos),
        eqOp(item.organization_id, organizationId)
      ),
    columns: { id: true },
  })
  return rows.length === unicos.length
}
