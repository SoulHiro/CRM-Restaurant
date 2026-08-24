import 'server-only'

import { db } from '@/lib/db'
import { toNumber } from '@/lib/numeric'
import {
  getEstoqueItensAtivos,
  getUltimosPrecos,
} from '@/features/estoque/lib/queries'

import type {
  AdicionalOption,
  CategoriaProdutoOption,
  ClassificacaoOption,
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

export async function getClassificacoes(): Promise<ClassificacaoOption[]> {
  const rows = await db.query.classificacao.findMany({
    orderBy: (classificacao, { asc }) => [asc(classificacao.nome)],
  })

  return rows.map((row) => ({
    id: row.id,
    nome: row.nome,
    aplicaA: row.aplica_a,
  }))
}

export async function getAdicionais(): Promise<AdicionalOption[]> {
  const rows = await db.query.adicional.findMany({
    where: (adicional, { eq }) => eq(adicional.ativo, true),
    orderBy: (adicional, { asc }) => [asc(adicional.nome)],
  })

  return rows.map((row) => ({
    id: row.id,
    nome: row.nome,
    preco: toNumber(row.preco),
    ativo: row.ativo,
  }))
}

export async function getProdutos(): Promise<ProdutoListItem[]> {
  const rows = await db.query.produto.findMany({
    with: { categoria: { columns: { nome: true } } },
    orderBy: (produto, { asc }) => [asc(produto.nome)],
  })

  return rows.map((row) => ({
    id: row.id,
    nome: row.nome,
    categoriaNome: row.categoria?.nome ?? null,
    tipo: row.tipo,
    precoVenda: row.preco_venda == null ? null : toNumber(row.preco_venda),
    disponibilidadeStatus: row.disponibilidade_status,
    disponivelDelivery: row.disponivel_delivery,
    disponivelLocal: row.disponivel_local,
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
