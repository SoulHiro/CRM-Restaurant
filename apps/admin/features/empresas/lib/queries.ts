import 'server-only'

import { and, count, eq } from 'drizzle-orm'

import { db } from '@/lib/db'
import { dataISO, hojeISO } from '@/lib/formatters'
import {
  colaborador_pedido,
  empresa,
  fechamento_dia_empresa,
  fechamento_dia_item,
  pedido_dia_importado,
} from '@repo/db'

import { toNumber } from '@/lib/numeric'
import { ehRecusa } from './importacao-helpers'
import type {
  ContagemTamanhos,
  EmpresaDetail,
  EmpresaListItem,
  FechamentoDia,
  ItemFechamento,
  PedidoDoDiaItem,
  PrecoPadraoTipo,
  PrecosPadraoEmpresa,
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
    endereco: {
      cep: row.cep ?? '',
      logradouro: row.logradouro ?? '',
      numero: row.numero ?? '',
      complemento: row.complemento ?? undefined,
      bairro: row.bairro ?? '',
      cidade: row.cidade ?? '',
      uf: row.uf ?? '',
    },
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
 * Só quem tem pedido de fato pra essa data — colaborador ativo sem pedido
 * importado hoje simplesmente não aparece (ver `docs/rules` — a tela é pra
 * "quem pediu hoje", não pra listar todo o cadastro). "Recusou" continua
 * distinto de "sem pedido": é quem tem pedido, mas marcado como não vai
 * comer (`recusou` explícito, ver `marcarRecusaAction`, ou texto de recusa
 * vindo da planilha, `ehRecusa`).
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

  return colaboradores
    .filter((colaborador) => colaborador.pedidos.length > 0)
    .map((colaborador) => {
      const pedido = colaborador.pedidos[0]!
      return {
        colaboradorId: colaborador.id,
        nome: colaborador.nome,
        whatsapp: colaborador.whatsapp,
        tipo: pedido.tipo,
        turno: pedido.turno,
        tamanho: pedido.tamanho,
        prato: pedido.prato,
        preco: pedido.preco != null ? toNumber(pedido.preco) : null,
        observacao: pedido.observacao,
        respondidoEm: pedido.respondido_em?.toISOString() ?? null,
        recusou: pedido.recusou || ehRecusa(pedido.prato),
      }
    })
}

/**
 * Soma P/M/G/lanche dos pedidos reais daquele dia — quem recusou
 * (`ehRecusa`) não entra na conta, é diferente de "vai comer". Usado no
 * fechamento do dia, sempre recalculado no servidor: nunca confia em
 * contagem vinda do cliente.
 */
export async function getContagemTamanhos(
  empresaId: string,
  data: string
): Promise<ContagemTamanhos> {
  const rows = await db
    .select({
      tipo: pedido_dia_importado.tipo,
      tamanho: pedido_dia_importado.tamanho,
      prato: pedido_dia_importado.prato,
      recusou: pedido_dia_importado.recusou,
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

  const contagem: ContagemTamanhos = { p: 0, m: 0, g: 0, lanche: 0 }
  for (const row of rows) {
    if (row.recusou || ehRecusa(row.prato)) continue
    if (row.tipo === 'lanche') {
      contagem.lanche++
      continue
    }
    if (row.tamanho === 'P') contagem.p++
    else if (row.tamanho === 'M') contagem.m++
    else if (row.tamanho === 'G') contagem.g++
  }
  return contagem
}

function mapItemFechamento(
  row: typeof fechamento_dia_item.$inferSelect
): ItemFechamento {
  return {
    colaboradorNome: row.colaborador_nome,
    tipo: row.tipo,
    prato: row.prato,
    tamanho: row.tamanho,
    preco: toNumber(row.preco),
  }
}

function mapFechamento(
  row: typeof fechamento_dia_empresa.$inferSelect & {
    itens?: (typeof fechamento_dia_item.$inferSelect)[]
  }
): FechamentoDia {
  return {
    data: row.data,
    quantidadeP: row.quantidade_p,
    precoUnitarioP: toNumber(row.preco_unitario_p),
    quantidadeM: row.quantidade_m,
    precoUnitarioM: toNumber(row.preco_unitario_m),
    quantidadeG: row.quantidade_g,
    precoUnitarioG: toNumber(row.preco_unitario_g),
    quantidadeCafe: row.quantidade_cafe,
    precoUnitarioCafe: toNumber(row.preco_unitario_cafe),
    quantidadeSuco: row.quantidade_suco,
    precoUnitarioSuco: toNumber(row.preco_unitario_suco),
    quantidadeLanche: row.quantidade_lanche,
    finalizadoPor: row.finalizado_por,
    finalizadoEm: row.finalizado_em.toISOString(),
    itens: (row.itens ?? []).map(mapItemFechamento),
  }
}

/** Com os itens (para reimpressão) — usado ao abrir o drawer "Finalizar dia". */
export async function getFechamentoDoDia(
  empresaId: string,
  data: string
): Promise<FechamentoDia | null> {
  const row = await db.query.fechamento_dia_empresa.findFirst({
    where: (f, { and: andOp, eq: eqOp }) =>
      andOp(eqOp(f.empresa_id, empresaId), eqOp(f.data, data)),
    with: { itens: true },
  })

  return row ? mapFechamento(row) : null
}

/**
 * Mais recentes primeiro — histórico de fechamentos já feitos pra empresa.
 * Sem itens (lista, não precisa do detalhe linha a linha).
 */
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

const NOME_PADRAO_POR_TIPO: Record<PrecoPadraoTipo, string> = {
  marmita_p: 'Marmita P',
  marmita_m: 'Marmita M',
  marmita_g: 'Marmita G',
  cafe: 'Café',
  suco: 'Suco',
  lanche: 'Lanche',
  garrafa_cafe_adicional: 'Garrafa de café adicional',
}

/**
 * Valores padrão da empresa (marmita P/M/G, café, suco, lanche, garrafa de
 * café adicional) — sempre devolve as 7 chaves, com nome/preço zerados pros
 * tipos ainda não configurados, pra quem usa não precisar tratar ausência.
 */
export async function getPrecosEmpresa(
  empresaId: string
): Promise<PrecosPadraoEmpresa> {
  const rows = await db.query.empresa_preco_padrao.findMany({
    where: (p, { eq: eqOp }) => eqOp(p.empresa_id, empresaId),
  })

  const porTipo = new Map(rows.map((row) => [row.tipo, row]))

  return Object.fromEntries(
    (Object.keys(NOME_PADRAO_POR_TIPO) as PrecoPadraoTipo[]).map((tipo) => {
      const row = porTipo.get(tipo)
      return [
        tipo,
        {
          nome: row?.nome ?? NOME_PADRAO_POR_TIPO[tipo],
          preco: row ? toNumber(row.preco) : 0,
        },
      ]
    })
  ) as PrecosPadraoEmpresa
}
