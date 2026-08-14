import 'server-only'

import { and, desc, eq, inArray } from 'drizzle-orm'

import { db } from '@/lib/db'
import { hojeISO } from '@/lib/formatters'
import { toNumber } from '@/lib/numeric'
import { cargo, conta_a_pagar, folha_pagamento } from '@repo/db'

import { diasDeAusencia, SABADO } from './ausencia-helpers'
import {
  competenciaDe,
  montarPreviaFolha,
  totalFolha,
  vencimentoPadrao,
} from './folha-helpers'
import { salarioVigenteEm } from './salario-helpers'
import type {
  Ausencia,
  Beneficio,
  Cargo,
  FolhaFechada,
  FolhaPrevia,
  FuncionarioDetalhe,
  FuncionarioListItem,
  RegistroSalario,
} from './types'

const COM_TUDO = {
  cargo: { columns: { nome: true } },
  entregador: true,
  salarios: true,
  beneficios: true,
  ausencias: true,
} as const

type FuncionarioRow = {
  id: string
  nome: string
  cpf_final: string | null
  cnpj: string | null
  cargo_id: string
  turno: FuncionarioListItem['turno']
  modelo_contratual: FuncionarioListItem['modeloContratual']
  data_admissao: string
  data_desligamento: string | null
  status: FuncionarioListItem['status']
  motivo_desligamento: FuncionarioListItem['motivoDesligamento']
  created_at: Date
  cargo: { nome: string }
  entregador: {
    id: string
    valor_diaria: string
    taxa_entrega_percentual: string | null
    folga_semanal: number | null
  } | null
  salarios: { valor: string; vigente_desde: string }[]
}

/**
 * O CPF completo nunca sai daqui — só `cpfFinal`, os últimos dígitos. Ver
 * `revelarCpfAction` em `actions.ts` para o caminho auditado de leitura.
 */
function mapFuncionario(row: FuncionarioRow, hoje: string): FuncionarioListItem {
  const vigencias = row.salarios.map((s) => ({
    valor: toNumber(s.valor),
    vigenteDesde: s.vigente_desde,
  }))

  return {
    id: row.id,
    nome: row.nome,
    cpfFinal: row.cpf_final,
    cnpj: row.cnpj,
    cargoId: row.cargo_id,
    cargoNome: row.cargo.nome,
    turno: row.turno,
    modeloContratual: row.modelo_contratual,
    dataAdmissao: row.data_admissao,
    dataDesligamento: row.data_desligamento,
    status: row.status,
    motivoDesligamento: row.motivo_desligamento,
    salarioAtual: salarioVigenteEm(vigencias, hoje)?.valor ?? null,
    entregador: row.entregador
      ? {
          id: row.entregador.id,
          valorDiaria: toNumber(row.entregador.valor_diaria),
          taxaEntregaPercentual:
            row.entregador.taxa_entrega_percentual == null
              ? null
              : toNumber(row.entregador.taxa_entrega_percentual),
          folgaSemanal: row.entregador.folga_semanal,
        }
      : null,
  }
}

export async function getFuncionarios(): Promise<FuncionarioListItem[]> {
  const hoje = hojeISO()
  const rows = await db.query.funcionario_interno.findMany({
    with: {
      cargo: { columns: { nome: true } },
      entregador: true,
      salarios: { columns: { valor: true, vigente_desde: true } },
    },
    orderBy: (f, { asc }) => [asc(f.nome)],
  })

  return rows.map((row) => mapFuncionario(row as FuncionarioRow, hoje))
}

export async function getEntregadores(): Promise<FuncionarioListItem[]> {
  const funcionarios = await getFuncionarios()
  return funcionarios.filter((funcionario) => funcionario.entregador != null)
}

export async function getFuncionarioDetalhe(
  id: string
): Promise<FuncionarioDetalhe | null> {
  const row = await db.query.funcionario_interno.findFirst({
    where: (f, { eq: igual }) => igual(f.id, id),
    with: {
      cargo: { columns: { nome: true } },
      entregador: true,
      salarios: {
        orderBy: (s, { desc: descOrder }) => [descOrder(s.vigente_desde)],
        with: { usuario: { columns: { name: true } } },
      },
      beneficios: true,
      ausencias: {
        orderBy: (a, { desc: descOrder }) => [descOrder(a.data_inicio)],
        with: { usuario: { columns: { name: true } } },
      },
    },
  })

  if (!row) return null

  const base = mapFuncionario(row as unknown as FuncionarioRow, hojeISO())

  const salarios: RegistroSalario[] = row.salarios.map((registro) => ({
    id: registro.id,
    valor: toNumber(registro.valor),
    vigenteDesde: registro.vigente_desde,
    motivo: registro.motivo,
    observacao: registro.observacao,
    responsavel: registro.usuario?.name ?? null,
    criadoEm: registro.created_at.toISOString(),
  }))

  const ausencias: Ausencia[] = row.ausencias.map((ausencia) => ({
    id: ausencia.id,
    funcionarioId: row.id,
    funcionarioNome: row.nome,
    tipo: ausencia.tipo,
    dataInicio: ausencia.data_inicio,
    dataFim: ausencia.data_fim,
    dias: diasDeAusencia(ausencia.data_inicio, ausencia.data_fim),
    documentoAnexo: ausencia.documento_anexo,
    observacao: ausencia.observacao,
    responsavel: ausencia.usuario?.name ?? null,
  }))

  const beneficios: Beneficio[] = row.beneficios.map((beneficio) => ({
    id: beneficio.id,
    tipo: beneficio.tipo,
    valor: toNumber(beneficio.valor),
    recorrente: beneficio.recorrente,
    ativo: beneficio.ativo,
    observacao: beneficio.observacao,
  }))

  return {
    ...base,
    criadoEm: row.created_at.toISOString(),
    salarios,
    ausencias,
    beneficios,
  }
}

export async function getCargos(): Promise<Cargo[]> {
  const rows = await db.query.cargo.findMany({
    with: { funcionarios: { columns: { id: true, status: true } } },
    orderBy: (c, { asc }) => [asc(c.nome)],
  })

  return rows.map((row) => ({
    id: row.id,
    nome: row.nome,
    salarioBase: toNumber(row.salario_base),
    valorDiariaPadrao:
      row.valor_diaria_padrao == null
        ? null
        : toNumber(row.valor_diaria_padrao),
    ativo: row.ativo,
    ocupantes: row.funcionarios.filter((f) => f.status === 'ativo').length,
  }))
}

export async function getCargoById(id: string): Promise<Cargo | null> {
  const row = await db.query.cargo.findFirst({ where: eq(cargo.id, id) })
  if (!row) return null

  return {
    id: row.id,
    nome: row.nome,
    salarioBase: toNumber(row.salario_base),
    valorDiariaPadrao:
      row.valor_diaria_padrao == null
        ? null
        : toNumber(row.valor_diaria_padrao),
    ativo: row.ativo,
    ocupantes: 0,
  }
}

/**
 * Prévia calculada na hora a partir do estado atual — nada aqui está gravado.
 * Vira `folha_pagamento` + `folha_item[]` só quando alguém confirma.
 */
export async function getPreviaFolha(
  competencia: string,
  diaPagamentoSemanal = SABADO
): Promise<FolhaPrevia> {
  const rows = await db.query.funcionario_interno.findMany({
    with: COM_TUDO,
  })

  const vencimentoMensal = vencimentoPadrao(competencia)

  const linhas = montarPreviaFolha(
    rows.map((row) => ({
      id: row.id,
      nome: row.nome,
      cargoNome: row.cargo.nome,
      dataAdmissao: row.data_admissao,
      dataDesligamento: row.data_desligamento,
      salarios: row.salarios.map((s) => ({
        valor: toNumber(s.valor),
        vigenteDesde: s.vigente_desde,
      })),
      beneficios: row.beneficios.map((b) => ({
        tipo: b.tipo,
        valor: toNumber(b.valor),
        recorrente: b.recorrente,
        ativo: b.ativo,
      })),
      ausencias: row.ausencias.map((a) => ({
        dataInicio: a.data_inicio,
        dataFim: a.data_fim,
      })),
      entregador: row.entregador
        ? {
            valorDiaria: toNumber(row.entregador.valor_diaria),
            folgaSemanal: row.entregador.folga_semanal,
          }
        : null,
    })),
    competencia,
    diaPagamentoSemanal,
    vencimentoMensal
  )

  return {
    competencia,
    dataVencimento: vencimentoMensal,
    diaPagamentoSemanal,
    linhas,
    total: totalFolha(linhas),
  }
}

async function mapFolha(row: {
  id: string
  competencia: string
  data_vencimento: string
  observacao: string | null
  created_at: Date
  usuario?: { name: string } | null
  itens: {
    id: string
    funcionario_interno_id: string
    tipo: FolhaFechada['linhas'][number]['tipo']
    descricao: string
    valor: string
    data_vencimento: string | null
    funcionario: { nome: string }
  }[]
}): Promise<FolhaFechada> {
  const contas = row.itens.length
    ? await db
        .select({ origemId: conta_a_pagar.origem_id, status: conta_a_pagar.status })
        .from(conta_a_pagar)
        .where(
          and(
            eq(conta_a_pagar.origem_tipo, 'folha_item'),
            inArray(
              conta_a_pagar.origem_id,
              row.itens.map((item) => item.id)
            )
          )
        )
    : []

  const pagas = new Set(
    contas.filter((c) => c.status === 'pago').map((c) => c.origemId)
  )

  const linhas = row.itens.map((item) => ({
    id: item.id,
    funcionarioId: item.funcionario_interno_id,
    funcionarioNome: item.funcionario.nome,
    tipo: item.tipo,
    descricao: item.descricao,
    valor: toNumber(item.valor),
    dataVencimento: item.data_vencimento ?? row.data_vencimento,
    contaPaga: pagas.has(item.id),
  }))

  return {
    id: row.id,
    competencia: row.competencia,
    dataVencimento: row.data_vencimento,
    observacao: row.observacao,
    responsavel: row.usuario?.name ?? null,
    criadoEm: row.created_at.toISOString(),
    linhas: linhas.sort((a, b) =>
      a.funcionarioNome.localeCompare(b.funcionarioNome, 'pt-BR')
    ),
    total: totalFolha(linhas),
    temContaPaga: pagas.size > 0,
  }
}

export async function getFolhaDaCompetencia(
  competencia: string
): Promise<FolhaFechada | null> {
  const row = await db.query.folha_pagamento.findFirst({
    where: eq(folha_pagamento.competencia, competencia),
    with: {
      usuario: { columns: { name: true } },
      itens: { with: { funcionario: { columns: { nome: true } } } },
    },
  })

  return row ? mapFolha(row) : null
}

export async function getFolhasFechadas(
  limite = 12
): Promise<{ id: string; competencia: string; total: number }[]> {
  const rows = await db.query.folha_pagamento.findMany({
    with: { itens: { columns: { valor: true } } },
    orderBy: [desc(folha_pagamento.competencia)],
    limit: limite,
  })

  return rows.map((row) => ({
    id: row.id,
    competencia: row.competencia,
    total: totalFolha(row.itens.map((item) => ({ valor: toNumber(item.valor) }))),
  }))
}

export async function getCompetenciaAtual(): Promise<string> {
  return competenciaDe(hojeISO())
}
