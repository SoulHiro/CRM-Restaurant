import 'server-only'

import { and, eq } from 'drizzle-orm'

import { db } from '@/lib/db'
import { comanda as comandaTable } from '@repo/db'
import { hojeISO } from '@/lib/formatters'
import { reaisParaCentavos, somarCentavos } from './dinheiro'
import type { FichaTecnicaLinha, OverrideTamanho } from './ficha-tecnica-consumo'
import type {
  ComandaItemView,
  ComandaPagamentoView,
  ComandaView,
  ConfiguracaoSalao,
  ProdutoLancamento,
} from './types'

export async function getConfiguracaoSalao(
  organizationId: string
): Promise<ConfiguracaoSalao> {
  const row = await db.query.configuracao_salao.findFirst({
    where: (c, { eq: eqOp }) => eqOp(c.organization_id, organizationId),
  })
  return { quantidadeComandas: row?.quantidade_comandas ?? 200 }
}

export async function getProdutosParaLancamento(
  organizationId: string
): Promise<ProdutoLancamento[]> {
  const hoje = hojeISO()
  const rows = await db.query.produto.findMany({
    where: (produto, { eq: eqOp, and: andOp }) =>
      andOp(eqOp(produto.organization_id, organizationId), eqOp(produto.ativo, true)),
    with: {
      categoria: { columns: { nome: true } },
      tamanhos: { orderBy: (t, { asc }) => [asc(t.ordem)] },
    },
    orderBy: (produto, { asc }) => [asc(produto.nome)],
  })

  return rows
    .filter((row) => row.pausado_em !== hoje)
    .map((row) => ({
      id: row.id,
      nome: row.nome,
      categoriaNome: row.categoria?.nome ?? null,
      codigoRapido: row.codigo_rapido,
      temTamanhos: row.tem_tamanhos,
      precoVendaCentavos:
        row.preco_venda == null ? null : reaisParaCentavos(Number(row.preco_venda)),
      tamanhos: row.tamanhos.map((t) => ({
        id: t.id,
        nome: t.nome,
        precoVendaCentavos: reaisParaCentavos(Number(t.preco_venda)),
      })),
    }))
}

interface FichaTecnicaParaConsumo {
  fichaTecnica: FichaTecnicaLinha[]
  overrides: OverrideTamanho[]
  pesoGramas: number | null
  pesoBaseGramas: number | null
}

/**
 * Busca a ficha técnica de um produto (já pertencente ao tenant) pronta pra
 * `calcularConsumoInsumos` — usada por `lancarItemAction` pra saber quanto
 * baixar de cada insumo. `produtoTamanhoId` resolve o multiplicador de peso
 * contra o tamanho-base do produto.
 */
export async function getFichaTecnicaParaConsumo(
  organizationId: string,
  produtoId: string,
  produtoTamanhoId?: string
): Promise<FichaTecnicaParaConsumo | null> {
  const produto = await db.query.produto.findFirst({
    where: (p, { eq: eqOp, and: andOp }) =>
      andOp(eqOp(p.id, produtoId), eqOp(p.organization_id, organizationId)),
    with: {
      fichaTecnica: true,
      tamanhos: true,
    },
  })
  if (!produto) return null

  const tamanhoEscolhido = produtoTamanhoId
    ? produto.tamanhos.find((t) => t.id === produtoTamanhoId)
    : null
  const tamanhoBase = produto.tamanhos.find((t) => t.is_base)

  const overrides = produto.fichaTecnica.length
    ? await db.query.produto_ficha_tecnica_tamanho_override.findMany({
        where: (o, { inArray, eq: eqOp, and: andOp }) =>
          andOp(
            inArray(
              o.ficha_tecnica_item_id,
              produto.fichaTecnica.map((item) => item.id)
            ),
            tamanhoEscolhido ? eqOp(o.produto_tamanho_id, tamanhoEscolhido.id) : undefined
          ),
      })
    : []

  return {
    fichaTecnica: produto.fichaTecnica.map((item) => ({
      id: item.id,
      estoqueItemId: item.estoque_item_id,
      quantidade: Number(item.quantidade),
      tipoEscala: item.tipo_escala,
    })),
    overrides: overrides.map((o) => ({
      fichaTecnicaItemId: o.ficha_tecnica_item_id,
      estoqueItemId: o.estoque_item_id,
      quantidade: Number(o.quantidade),
    })),
    pesoGramas: tamanhoEscolhido?.peso_gramas ?? null,
    pesoBaseGramas: tamanhoBase?.peso_gramas ?? null,
  }
}

function montarComandaView(row: {
  id: string
  numero: number
  data: string
  mesa_label: string | null
  status: 'aberta' | 'fechada' | 'cancelada'
  aberto_em: Date
  fechado_em: Date | null
  nota_pendente: boolean
  cliente_email: string | null
  observacao: string | null
  abertoPor: { name: string } | null
  itens: {
    id: string
    produto_id: string
    produto_tamanho_id: string | null
    quantidade: string
    preco_unitario_centavos: number
    observacao: string | null
    enviado_cozinha_em: Date | null
    excluido: boolean
    criado_em: Date
    produto: { nome: string }
    tamanho: { nome: string } | null
  }[]
  pagamentos: {
    id: string
    forma: 'credito' | 'debito' | 'pix' | 'dinheiro'
    valor_centavos: number
    criado_em: Date
  }[]
}): ComandaView {
  const itensAtivos = row.itens.filter((item) => !item.excluido)

  const itens: ComandaItemView[] = itensAtivos.map((item) => {
    const quantidade = Number(item.quantidade)
    return {
      id: item.id,
      produtoId: item.produto_id,
      produtoNome: item.produto.nome,
      produtoTamanhoId: item.produto_tamanho_id,
      produtoTamanhoNome: item.tamanho?.nome ?? null,
      quantidade,
      precoUnitarioCentavos: item.preco_unitario_centavos,
      totalCentavos: Math.round(item.preco_unitario_centavos * quantidade),
      observacao: item.observacao,
      enviadoCozinha: item.enviado_cozinha_em != null,
      criadoEm: item.criado_em.toISOString(),
    }
  })

  const pagamentos: ComandaPagamentoView[] = row.pagamentos.map((p) => ({
    id: p.id,
    forma: p.forma,
    valorCentavos: p.valor_centavos,
    criadoEm: p.criado_em.toISOString(),
  }))

  const totalCentavos = somarCentavos(itens.map((i) => i.totalCentavos))
  const pagoCentavos = somarCentavos(pagamentos.map((p) => p.valorCentavos))

  return {
    id: row.id,
    numero: row.numero,
    data: row.data,
    mesaLabel: row.mesa_label,
    status: row.status,
    abertoPorNome: row.abertoPor?.name ?? '—',
    abertoEm: row.aberto_em.toISOString(),
    fechadoEm: row.fechado_em?.toISOString() ?? null,
    notaPendente: row.nota_pendente,
    clienteEmail: row.cliente_email,
    observacao: row.observacao,
    itens,
    pagamentos,
    totalCentavos,
    pagoCentavos,
    saldoDevidoCentavos: Math.max(0, totalCentavos - pagoCentavos),
  }
}

const COMANDA_COM_RELACOES = {
  abertoPor: { columns: { name: true } },
  itens: {
    with: {
      produto: { columns: { nome: true } },
      tamanho: { columns: { nome: true } },
    },
  },
  pagamentos: true,
} as const

export async function getComandasAbertas(
  organizationId: string
): Promise<ComandaView[]> {
  const rows = await db.query.comanda.findMany({
    where: (c, { eq: eqOp, and: andOp }) =>
      andOp(eqOp(c.organization_id, organizationId), eqOp(c.status, 'aberta')),
    with: COMANDA_COM_RELACOES,
    orderBy: (c, { asc }) => [asc(c.numero)],
  })
  return rows.map(montarComandaView)
}

export async function getComandaDetalhe(
  organizationId: string,
  comandaId: string
): Promise<ComandaView | null> {
  const row = await db.query.comanda.findFirst({
    where: (c, { eq: eqOp, and: andOp }) =>
      andOp(eqOp(c.id, comandaId), eqOp(c.organization_id, organizationId)),
    with: COMANDA_COM_RELACOES,
  })
  return row ? montarComandaView(row) : null
}

export async function getNumerosOcupados(organizationId: string): Promise<Set<number>> {
  const rows = await db
    .select({ numero: comandaTable.numero })
    .from(comandaTable)
    .where(
      and(
        eq(comandaTable.organization_id, organizationId),
        eq(comandaTable.status, 'aberta')
      )
    )
  return new Set(rows.map((r) => r.numero))
}

export async function getNotasPendentesHoje(
  organizationId: string
): Promise<ComandaView[]> {
  const hoje = hojeISO()
  const rows = await db.query.comanda.findMany({
    where: (c, { eq: eqOp, and: andOp }) =>
      andOp(
        eqOp(c.organization_id, organizationId),
        eqOp(c.nota_pendente, true),
        eqOp(c.data, hoje)
      ),
    with: COMANDA_COM_RELACOES,
    orderBy: (c, { asc }) => [asc(c.numero)],
  })
  return rows.map(montarComandaView)
}
