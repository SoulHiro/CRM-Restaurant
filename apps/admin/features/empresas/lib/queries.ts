import 'server-only'

import { and, count, eq } from 'drizzle-orm'

import { db } from '@/lib/db'
import { dataISO, hojeISO } from '@/lib/formatters'
import {
  colaborador_pedido,
  empresa,
  fechamento_dia_empresa,
  pedido_dia_importado,
} from '@repo/db'

import { toNumber } from '@/lib/numeric'
import { ehRecusa } from './importacao-helpers'
import type {
  ContagemTamanhos,
  EmpresaDetail,
  EmpresaListItem,
  FechamentoDia,
  PedidoDoDiaItem,
} from './types'
import { EMPTY_DETAIL, mockEmpresaDetails } from './mock-data/empresa-details'

/**
 * `funcionariosTotal`/`funcionariosRespondidos`/`status` vêm do domínio leve
 * de importação (`colaborador_pedido`/`pedido_dia_importado`), não de dado
 * inventado — é a única parte de "empresa" com tabela real hoje. O resto de
 * `EmpresaDetail` (contrato, funcionários estruturados, faturamento,
 * satisfação) continua mock: não tem schema nenhum ainda.
 */
async function mapEmpresa(
  row: typeof empresa.$inferSelect
): Promise<EmpresaListItem> {
  const hoje = hojeISO()

  const [totalRow] = await db
    .select({ total: count() })
    .from(colaborador_pedido)
    .where(
      and(
        eq(colaborador_pedido.empresa_id, row.id),
        eq(colaborador_pedido.ativo, true)
      )
    )

  const [respondidosRow] = await db
    .select({ total: count() })
    .from(pedido_dia_importado)
    .innerJoin(
      colaborador_pedido,
      eq(pedido_dia_importado.colaborador_id, colaborador_pedido.id)
    )
    .where(
      and(
        eq(colaborador_pedido.empresa_id, row.id),
        eq(pedido_dia_importado.data, hoje)
      )
    )

  const total = totalRow?.total ?? 0
  const respondidos = respondidosRow?.total ?? 0

  return {
    id: row.id,
    nome: row.nome,
    cnpj: row.cnpj,
    email: row.email_contato ?? '',
    responsavelNome: row.responsavel_nome ?? '',
    responsavelTelefone: row.telefone_contato ?? '',
    cadastradaEm: dataISO(row.created_at),
    funcionariosTotal: total,
    funcionariosRespondidos: respondidos,
    // Sem colaborador nenhum ainda não é "aguardando resposta" — é "nada
    // importado", mas a tela não distingue os dois hoje; tratar como
    // aguardando é o lado seguro (não esconde uma empresa sem pedidos de hoje).
    status: total > 0 && respondidos === total ? 'finalizado' : 'aguardando',
  }
}

export async function getEmpresas(): Promise<EmpresaListItem[]> {
  const rows = await db.query.empresa.findMany({
    orderBy: (e, { asc }) => [asc(e.nome)],
  })

  return Promise.all(rows.map(mapEmpresa))
}

export async function getEmpresaById(
  id: string
): Promise<EmpresaListItem | null> {
  const row = await db.query.empresa.findFirst({
    where: eq(empresa.id, id),
  })

  return row ? mapEmpresa(row) : null
}

/**
 * Continua mock: contrato, funcionários estruturados, envios, satisfação e
 * faturamento não têm tabela nenhuma ainda (ver docs/database-schema.md). A
 * aba "Pedidos" real (importação de planilha) usa `getPedidosDoDia`, uma
 * função à parte — não passa por aqui.
 */
export async function getEmpresaDetail(id: string): Promise<EmpresaDetail> {
  return mockEmpresaDetails[id] ?? EMPTY_DETAIL
}

/**
 * Um colaborador ativo por linha, com o pedido daquele dia (ou nada, se não
 * respondeu). "Recusou" (`ehRecusa`) é diferente de "sem pedido" — separa
 * quem disse explicitamente que não vai de quem só não importou nada ainda.
 */
export async function getPedidosDoDia(
  empresaId: string,
  data: string
): Promise<PedidoDoDiaItem[]> {
  const colaboradores = await db.query.colaborador_pedido.findMany({
    where: (c, { and: andOp, eq: eqOp }) =>
      andOp(eqOp(c.empresa_id, empresaId), eqOp(c.ativo, true)),
    with: {
      pedidos: {
        where: (p, { eq: eqOp }) => eqOp(p.data, data),
        limit: 1,
      },
    },
    orderBy: (c, { asc }) => [asc(c.nome)],
  })

  return colaboradores.map((colaborador) => {
    const pedido = colaborador.pedidos[0] ?? null
    return {
      colaboradorId: colaborador.id,
      nome: colaborador.nome,
      whatsapp: colaborador.whatsapp,
      turno: pedido?.turno ?? null,
      tamanho: pedido?.tamanho ?? null,
      prato: pedido?.prato ?? null,
      observacao: pedido?.observacao ?? null,
      respondidoEm: pedido?.respondido_em?.toISOString() ?? null,
      recusou: ehRecusa(pedido?.prato ?? null),
    }
  })
}

/**
 * Soma P/M/G dos pedidos reais daquele dia — quem recusou (`ehRecusa`) não
 * entra na conta, é diferente de "vai comer". Usado no fechamento do dia,
 * sempre recalculado no servidor: nunca confia em contagem vinda do cliente.
 */
export async function getContagemTamanhos(
  empresaId: string,
  data: string
): Promise<ContagemTamanhos> {
  const rows = await db
    .select({
      tamanho: pedido_dia_importado.tamanho,
      prato: pedido_dia_importado.prato,
    })
    .from(pedido_dia_importado)
    .innerJoin(
      colaborador_pedido,
      eq(pedido_dia_importado.colaborador_id, colaborador_pedido.id)
    )
    .where(
      and(
        eq(colaborador_pedido.empresa_id, empresaId),
        eq(pedido_dia_importado.data, data)
      )
    )

  const contagem: ContagemTamanhos = { p: 0, m: 0, g: 0 }
  for (const row of rows) {
    if (!row.tamanho || ehRecusa(row.prato)) continue
    if (row.tamanho === 'P') contagem.p++
    else if (row.tamanho === 'M') contagem.m++
    else if (row.tamanho === 'G') contagem.g++
  }
  return contagem
}

function mapFechamento(
  row: typeof fechamento_dia_empresa.$inferSelect
): FechamentoDia {
  return {
    data: row.data,
    quantidadeP: row.quantidade_p,
    quantidadeM: row.quantidade_m,
    quantidadeG: row.quantidade_g,
    quantidadeCafe: row.quantidade_cafe,
    precoUnitarioCafe: toNumber(row.preco_unitario_cafe),
    quantidadeSuco: row.quantidade_suco,
    precoUnitarioSuco: toNumber(row.preco_unitario_suco),
    quantidadeLanche: row.quantidade_lanche,
    precoUnitarioLanche: toNumber(row.preco_unitario_lanche),
    finalizadoPor: row.finalizado_por,
    finalizadoEm: row.finalizado_em.toISOString(),
  }
}

export async function getFechamentoDoDia(
  empresaId: string,
  data: string
): Promise<FechamentoDia | null> {
  const row = await db.query.fechamento_dia_empresa.findFirst({
    where: (f, { and: andOp, eq: eqOp }) =>
      andOp(eqOp(f.empresa_id, empresaId), eqOp(f.data, data)),
  })

  return row ? mapFechamento(row) : null
}

/** Mais recentes primeiro — histórico de fechamentos já feitos pra empresa. */
export async function listarFechamentosDaEmpresa(
  empresaId: string
): Promise<FechamentoDia[]> {
  const rows = await db.query.fechamento_dia_empresa.findMany({
    where: (f, { eq: eqOp }) => eqOp(f.empresa_id, empresaId),
    orderBy: (f, { desc }) => [desc(f.data)],
    limit: 60,
  })

  return rows.map(mapFechamento)
}

/**
 * A impressora escolhida em Configurações → Impressão
 * (`configuracao_comanda.impressora_id`); sem escolha ainda, cai na primeira
 * comanda ativa cadastrada.
 */
export async function getImpressoraComanda(): Promise<{
  id: string
  nome: string
  identificadorQz: string
} | null> {
  const config = await db.query.configuracaoComanda.findFirst({
    where: (c, { eq }) => eq(c.id, 'default'),
    columns: { impressora_id: true },
  })

  const row = config?.impressora_id
    ? await db.query.impressora.findFirst({
        where: (i, { eq }) => eq(i.id, config.impressora_id!),
      })
    : await db.query.impressora.findFirst({
        where: (i, { and: andOp, eq: eqOp }) =>
          andOp(eqOp(i.tipo, 'comanda'), eqOp(i.ativo, true)),
      })

  return row
    ? { id: row.id, nome: row.nome, identificadorQz: row.identificador_qz }
    : null
}
