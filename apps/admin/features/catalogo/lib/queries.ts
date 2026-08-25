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
  EditarProdutoInput,
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
      disponivelDelivery: row.disponivel_delivery,
      disponivelLocal: row.disponivel_local,
      apareceAlmoco: row.aparece_almoco,
      apareceJanta: row.aparece_janta,
      fotoUrl: row.foto_url,
      ativo: row.ativo,
    }
  })
}

/** Produto completo pra tela de edição — mesma forma que o form de cadastro usa, com id. */
export async function getProdutoDetalhe(
  id: string
): Promise<EditarProdutoInput | null> {
  const row = await db.query.produto.findFirst({
    where: (produto, { eq }) => eq(produto.id, id),
    with: {
      fichaTecnica: { with: { insumo: true } },
      tamanhos: { orderBy: (t, { asc }) => [asc(t.ordem)] },
      diasSemana: true,
      grupoAdicionais: true,
    },
  })

  if (!row) return null

  const precos = await getUltimosPrecos(
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
    descricao: row.descricao ?? '',
    fotoUrl: row.foto_url ?? '',
    videoUrl: row.video_url ?? '',
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
    descontoTipo: row.desconto_tipo === 'valor_fixo' ? 'valorFixo' : 'percentual',
    descontoValor: row.desconto_valor == null ? null : toNumber(row.desconto_valor),
    disponivelDelivery: row.disponivel_delivery,
    disponivelLocal: row.disponivel_local,
    pausadoHoje: row.pausado_em === hojeISO(),
    apareceAlmoco: row.aparece_almoco,
    apareceJanta: row.aparece_janta,
    diasSemana: row.diasSemana.map((d) => d.dia_semana),
    classificacoes: row.classificacoes ?? [],
    grupoAdicionalIds: row.grupoAdicionais.map((g) => g.grupo_id),
  }
}

export async function getProdutosDelivery(): Promise<ProdutoListItem[]> {
  const produtos = await getProdutos()
  return produtos.filter(
    (produto) => produto.ativo && produto.disponivelDelivery
  )
}
