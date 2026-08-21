import 'server-only'

import { db } from '@/lib/db'

import type {
  CardapioDiaPublico,
  ColaboradorOption,
  EmpresaCardapioInfo,
  RespostaExistente,
} from './types'

export async function getEmpresaPorSlug(
  slug: string
): Promise<EmpresaCardapioInfo | null> {
  const row = await db.query.empresa.findFirst({
    where: (e, { eq }) => eq(e.slug, slug),
    columns: { id: true, nome: true, preco_modo: true },
  })

  return row ? { id: row.id, nome: row.nome, precoModo: row.preco_modo } : null
}

/** Só funcionário ativo — mesma regra do combobox do admin, sem opção de criar nome novo aqui (ver contexto do plano). */
export async function getColaboradoresAtivos(
  empresaId: string
): Promise<ColaboradorOption[]> {
  return db.query.colaborador_pedido.findMany({
    where: (c, { and, eq }) =>
      and(
        eq(c.empresa_id, empresaId),
        eq(c.ativo, true),
        eq(c.tipo, 'funcionario')
      ),
    columns: { id: true, nome: true },
    orderBy: (c, { asc }) => [asc(c.nome)],
  })
}

export async function getCardapioSemana(
  empresaId: string,
  from: string,
  to: string
): Promise<CardapioDiaPublico[]> {
  const dias = await db.query.cardapioSemanaDia.findMany({
    where: (d, { and, eq, gte, lte }) =>
      and(eq(d.empresa_id, empresaId), gte(d.data, from), lte(d.data, to)),
    orderBy: (d, { asc }) => [asc(d.data)],
    with: { itens: { with: { prato: true } } },
  })

  return dias.map((dia) => {
    const destaqueRow = dia.itens.find((item) => item.destaque)
    return {
      data: dia.data,
      destaque: destaqueRow
        ? { id: destaqueRow.prato.id, nome: destaqueRow.prato.nome }
        : null,
      alternativas: dia.itens
        .filter((item) => !item.destaque)
        .map((item) => ({ id: item.prato.id, nome: item.prato.nome })),
    }
  })
}

/** O que essa pessoa já respondeu nesse intervalo — pra pré-preencher o form quando ela reabre o link. */
export async function getRespostasColaborador(
  colaboradorId: string,
  from: string,
  to: string
): Promise<RespostaExistente[]> {
  const rows = await db.query.pedido_dia_importado.findMany({
    where: (p, { and, eq, gte, lte }) =>
      and(
        eq(p.colaborador_id, colaboradorId),
        gte(p.data, from),
        lte(p.data, to)
      ),
    columns: { data: true, prato: true, tamanho: true, recusou: true },
  })

  return rows
}
