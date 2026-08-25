import 'server-only'

import { db } from '@/lib/db'
import { hojeISO } from '@/lib/formatters'
import { toNumber } from '@/lib/numeric'
import {
  getEstoqueItensAtivos,
  getUltimosPrecos,
} from '@/features/estoque/lib/queries'

import type {
  AdicionalItemOption,
  CategoriaProdutoOption,
  GrupoAdicionalOption,
  InsumoOption,
  ProdutoListItem,
} from './types'

const CATEGORIAS_FICHA_TECNICA = ['comestivel', 'preparo', 'embalagem'] as const

export async function getInsumosDisponiveis(): Promise<InsumoOption[]> {
  const itens = await getEstoqueItensAtivos()
  const elegiveis = itens.filter((item) =>
    (CATEGORIAS_FICHA_TECNICA as readonly string[]).includes(item.categoria)
  )
  const precos = await getUltimosPrecos(elegiveis.map((item) => item.id))

  return elegiveis.map((item) => ({
    id: item.id,
    nome: item.nome,
    unidade: item.unidade,
    categoria: item.categoria,
    custoUnitario: precos.get(item.id) ?? 0,
  }))
}

export async function getCategoriasProduto(): Promise<
  CategoriaProdutoOption[]
> {
  const rows = await db.query.categoria_produto.findMany({
    orderBy: (categoria, { asc }) => [
      asc(categoria.ordem),
      asc(categoria.nome),
    ],
  })

  return rows.map((row) => ({ id: row.id, nome: row.nome }))
}

function mapAdicionalItem(row: {
  id: string
  grupo_id: string
  nome: string
  preco: string
  foto_url: string | null
  quantidade_minima: number
  quantidade_maxima: number
  ativo: boolean
}): AdicionalItemOption {
  return {
    id: row.id,
    grupoId: row.grupo_id,
    nome: row.nome,
    preco: toNumber(row.preco),
    fotoUrl: row.foto_url,
    quantidadeMinima: row.quantidade_minima,
    quantidadeMaxima: row.quantidade_maxima,
    ativo: row.ativo,
  }
}

/** Grupos ativos, com os itens ativos de cada um — usado pra escolher no cadastro de produto. */
export async function getGruposAdicionais(): Promise<GrupoAdicionalOption[]> {
  const rows = await db.query.grupo_adicional.findMany({
    where: (grupo, { eq }) => eq(grupo.ativo, true),
    with: {
      itens: { where: (item, { eq }) => eq(item.ativo, true) },
    },
    orderBy: (grupo, { asc }) => [asc(grupo.nome)],
  })

  return rows.map((row) => ({
    id: row.id,
    nome: row.nome,
    disponivelAlmoco: row.disponivel_almoco,
    disponivelJanta: row.disponivel_janta,
    ativo: row.ativo,
    itens: row.itens.map(mapAdicionalItem),
  }))
}

export async function getGrupoAdicionalDetalhe(
  id: string
): Promise<GrupoAdicionalOption | null> {
  const row = await db.query.grupo_adicional.findFirst({
    where: (grupo, { eq }) => eq(grupo.id, id),
    with: { itens: true },
  })

  if (!row) return null

  return {
    id: row.id,
    nome: row.nome,
    disponivelAlmoco: row.disponivel_almoco,
    disponivelJanta: row.disponivel_janta,
    ativo: row.ativo,
    itens: row.itens.map(mapAdicionalItem),
  }
}

export async function getProdutos(): Promise<ProdutoListItem[]> {
  const hoje = hojeISO()

  const rows = await db.query.produto.findMany({
    with: { categoria: { columns: { nome: true } } },
    orderBy: (produto, { asc }) => [asc(produto.nome)],
  })

  return rows.map((row) => ({
    id: row.id,
    nome: row.nome,
    categoriaId: row.categoria_id,
    categoriaNome: row.categoria?.nome ?? null,
    tipo: row.tipo,
    precoVenda: row.preco_venda == null ? null : toNumber(row.preco_venda),
    pausadoHoje: row.pausado_em === hoje,
    disponivelDelivery: row.disponivel_delivery,
    disponivelLocal: row.disponivel_local,
    apareceAlmoco: row.aparece_almoco,
    apareceJanta: row.aparece_janta,
    fotoUrl: row.foto_url,
    ativo: row.ativo,
  }))
}

export async function getProdutosDelivery(): Promise<ProdutoListItem[]> {
  const produtos = await getProdutos()
  return produtos.filter(
    (produto) => produto.ativo && produto.disponivelDelivery
  )
}
