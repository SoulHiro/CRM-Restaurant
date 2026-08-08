import 'server-only'

import { and, desc, eq, gte, lte } from 'drizzle-orm'

import { db } from '@/lib/db'
import { toNumber } from '@/lib/numeric'
import {
  conta_a_pagar,
  conta_a_receber_b2b,
  meta,
  progresso_meta,
  transacao_financeira,
} from '@repo/db'

import type {
  AjusteMeta,
  ContaPagar,
  ContaReceber,
  Meta,
  Transacao,
} from './types'

type TransacaoRow = typeof transacao_financeira.$inferSelect

function mapTransacao(
  row: TransacaoRow & { usuario?: { name: string } | null }
): Transacao {
  return {
    id: row.id,
    tipo: row.tipo,
    origem: row.origem,
    valor: toNumber(row.valor),
    data: row.data,
    descricao: row.descricao,
    categoria: row.categoria,
    subtipo: row.subtipo,
    origemTipo: row.origem_tipo,
    origemId: row.origem_id,
    responsavel: row.usuario?.name ?? null,
    criadoEm: row.created_at.toISOString(),
  }
}

/**
 * Transações de um intervalo fechado de datas. Todo cálculo do módulo — DRE,
 * progresso de meta, margem por canal — parte daqui, porque o livro-razão é a
 * única fonte de verdade do dinheiro.
 */
export async function getTransacoesNoPeriodo(
  de: string,
  ate: string
): Promise<Transacao[]> {
  const rows = await db.query.transacao_financeira.findMany({
    where: and(
      gte(transacao_financeira.data, de),
      lte(transacao_financeira.data, ate)
    ),
    with: { usuario: { columns: { name: true } } },
    orderBy: (t, { desc: descOrder }) => [descOrder(t.data), descOrder(t.created_at)],
  })

  return rows.map(mapTransacao)
}

/** Último dia do mês 'YYYY-MM', respeitando fevereiro e ano bissexto. */
export function ultimoDiaDoMes(mes: string): string {
  const [ano, m] = mes.split('-').map(Number)
  if (!ano || !m) return `${mes}-28`
  const dia = new Date(Date.UTC(ano, m, 0)).getUTCDate()
  return `${mes}-${String(dia).padStart(2, '0')}`
}

export async function getTransacoesDoMes(mes: string): Promise<Transacao[]> {
  return getTransacoesNoPeriodo(`${mes}-01`, ultimoDiaDoMes(mes))
}

export async function getTransacaoById(
  id: string
): Promise<Transacao | null> {
  const row = await db.query.transacao_financeira.findFirst({
    where: eq(transacao_financeira.id, id),
    with: { usuario: { columns: { name: true } } },
  })

  return row ? mapTransacao(row) : null
}

export async function getContasPagar(): Promise<ContaPagar[]> {
  const rows = await db
    .select()
    .from(conta_a_pagar)
    .orderBy(desc(conta_a_pagar.data_vencimento))

  return rows.map((row) => ({
    id: row.id,
    descricao: row.descricao,
    categoria: row.categoria,
    subtipo: row.subtipo,
    valor: toNumber(row.valor),
    dataVencimento: row.data_vencimento,
    status: row.status,
    dataPagamento: row.data_pagamento,
    observacao: row.observacao,
    criadoEm: row.created_at.toISOString(),
  }))
}

export async function getContasReceber(): Promise<ContaReceber[]> {
  const rows = await db
    .select()
    .from(conta_a_receber_b2b)
    .orderBy(desc(conta_a_receber_b2b.data_vencimento))

  return rows.map((row) => ({
    id: row.id,
    empresaId: row.empresa_id,
    empresaNome: row.empresa_nome,
    periodo: row.periodo,
    valor: toNumber(row.valor),
    dataVencimento: row.data_vencimento,
    status: row.status,
    dataPagamento: row.data_pagamento,
    observacao: row.observacao,
    criadoEm: row.created_at.toISOString(),
  }))
}

function mapMeta(row: typeof meta.$inferSelect): Meta {
  return {
    id: row.id,
    descricao: row.descricao,
    tipo: row.tipo,
    valorAlvo: row.valor_alvo == null ? null : toNumber(row.valor_alvo),
    inicio: row.inicio,
    prazo: row.prazo,
    ativa: row.ativa,
  }
}

export async function getMetaAtiva(): Promise<Meta | null> {
  const row = await db.query.meta.findFirst({
    where: and(eq(meta.ativa, true), eq(meta.tipo, 'financeira')),
    orderBy: (m, { desc: descOrder }) => [descOrder(m.created_at)],
  })

  return row ? mapMeta(row) : null
}

export async function getAjustesMeta(metaId: string): Promise<AjusteMeta[]> {
  const rows = await db
    .select()
    .from(progresso_meta)
    .where(eq(progresso_meta.meta_id, metaId))
    .orderBy(desc(progresso_meta.data))

  return rows.map((row) => ({
    id: row.id,
    data: row.data,
    valor: toNumber(row.valor),
    observacao: row.observacao,
    criadoEm: row.created_at.toISOString(),
  }))
}

export interface FinanceiroPageData {
  transacoesDoMes: Transacao[]
  contasPagar: ContaPagar[]
  contasReceber: ContaReceber[]
  meta: Meta | null
  transacoesDaMeta: Transacao[]
  ajustesMeta: AjusteMeta[]
}

/**
 * Uma busca só para a página inteira — as quatro abas trocam no cliente, sem
 * ida ao servidor. O período da meta costuma ser maior que o mês exibido, por
 * isso vem numa consulta própria.
 */
export async function getFinanceiroPageData(
  mes: string
): Promise<FinanceiroPageData> {
  const [transacoesMes, contasPagar, contasReceber, metaAtiva] =
    await Promise.all([
      getTransacoesDoMes(mes),
      getContasPagar(),
      getContasReceber(),
      getMetaAtiva(),
    ])

  if (!metaAtiva) {
    return {
      transacoesDoMes: transacoesMes,
      contasPagar,
      contasReceber,
      meta: null,
      transacoesDaMeta: [],
      ajustesMeta: [],
    }
  }

  const [transacoesDaMeta, ajustesMeta] = await Promise.all([
    getTransacoesNoPeriodo(metaAtiva.inicio, metaAtiva.prazo),
    getAjustesMeta(metaAtiva.id),
  ])

  return {
    transacoesDoMes: transacoesMes,
    contasPagar,
    contasReceber,
    meta: metaAtiva,
    transacoesDaMeta,
    ajustesMeta,
  }
}
