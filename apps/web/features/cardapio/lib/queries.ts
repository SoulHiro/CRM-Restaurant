import 'server-only'

import { db } from '@/lib/db'

import type {
  CardapioDiaPublico,
  ColaboradorOption,
  EmpresaCardapioInfo,
  RespostaExistente,
  TurnoRefeicao,
} from './types'

export async function getEmpresaPorSlug(
  slug: string
): Promise<EmpresaCardapioInfo | null> {
  const row = await db.query.empresa.findFirst({
    where: (e, { eq }) => eq(e.slug, slug),
    columns: {
      id: true,
      nome: true,
      preco_modo: true,
      cardapio_qtd_alternativas: true,
      fluxo_pedido: true,
      aviso_cardapio: true,
    },
  })

  return row
    ? {
        id: row.id,
        nome: row.nome,
        precoModo: row.preco_modo,
        cardapioQtdAlternativas: row.cardapio_qtd_alternativas,
        fluxoPedido: row.fluxo_pedido,
        avisoCardapio: row.aviso_cardapio,
      }
    : null
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

/**
 * O cardápio é único pro restaurante — prato do dia e alternativas (já
 * ordenadas) vêm inteiros aqui; quem chama corta pra quantas alternativas a
 * empresa mostra (`empresa.cardapioQtdAlternativas`).
 */
export async function getCardapioSemana(
  from: string,
  to: string
): Promise<CardapioDiaPublico[]> {
  const dias = await db.query.cardapioSemanaDia.findMany({
    where: (d, { and, gte, lte }) => and(gte(d.data, from), lte(d.data, to)),
    orderBy: (d, { asc }) => [asc(d.data)],
    with: {
      itens: {
        orderBy: (i, { asc }) => [asc(i.ordem)],
        with: { prato: true },
      },
    },
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

/**
 * O que essa pessoa já respondeu nesse intervalo pra esse turno — pra
 * pré-preencher o form quando ela reabre o link. Filtra por turno porque a
 * mesma pessoa pode ter respostas de almoço E jantar no mesmo dia; sem o
 * filtro, a última linha lida (turno errado) pisaria no prato certo.
 */
export async function getRespostasColaborador(
  colaboradorId: string,
  turno: TurnoRefeicao,
  from: string,
  to: string
): Promise<RespostaExistente[]> {
  const rows = await db.query.pedido_dia_importado.findMany({
    where: (p, { and, eq, gte, lte }) =>
      and(
        eq(p.colaborador_id, colaboradorId),
        eq(p.turno, turno),
        gte(p.data, from),
        lte(p.data, to)
      ),
    columns: {
      data: true,
      prato: true,
      tamanho: true,
      observacao: true,
      recusou: true,
    },
  })

  return rows
}
