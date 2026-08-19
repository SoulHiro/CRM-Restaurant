import 'server-only'

import { db } from '@/lib/db'

import {
  CAMPOS_COMANDA_PADRAO,
  CAMPOS_RESUMO_PADRAO,
  TODOS_CAMPOS_COMANDA,
  TODOS_CAMPOS_RESUMO,
  type CampoComandaKey,
  type CampoResumoKey,
  type ConfiguracaoComanda,
  type ConfiguracaoLayoutResumo,
  type ConfiguracaoResumoDia,
  type ImpressoraOption,
} from './types'

function ehCampoValido(valor: string): valor is CampoComandaKey {
  return (TODOS_CAMPOS_COMANDA as string[]).includes(valor)
}

function ehCampoResumoValido(valor: string): valor is CampoResumoKey {
  return (TODOS_CAMPOS_RESUMO as string[]).includes(valor)
}

/**
 * Singleton (`id = 'default'`) — sem linha ainda, devolve o padrão em
 * memória, sem gravar nada. Só grava quando o usuário salva pela primeira
 * vez em Configurações.
 */
export async function getConfiguracaoComanda(): Promise<ConfiguracaoComanda> {
  const row = await db.query.configuracaoComanda.findFirst({
    where: (c, { eq }) => eq(c.id, 'default'),
  })

  if (!row) return { campos: CAMPOS_COMANDA_PADRAO, impressoraId: null }

  const campos = row.campos.filter(ehCampoValido)
  return {
    campos: campos.length > 0 ? campos : CAMPOS_COMANDA_PADRAO,
    impressoraId: row.impressora_id,
  }
}

export async function listarImpressorasComanda(): Promise<ImpressoraOption[]> {
  const rows = await db.query.impressora.findMany({
    where: (i, { and, eq }) => and(eq(i.tipo, 'comanda'), eq(i.ativo, true)),
    columns: { id: true, nome: true },
    orderBy: (i, { asc }) => [asc(i.nome)],
  })

  return rows
}

export async function getConfiguracaoResumoDia(): Promise<ConfiguracaoResumoDia> {
  const row = await db.query.configuracaoResumoDia.findFirst({
    where: (c, { eq }) => eq(c.id, 'default'),
  })

  return {
    cnpj: row?.cnpj ?? '',
    inscricaoEstadual: row?.inscricao_estadual ?? '',
    nomeEstabelecimento: row?.nome_estabelecimento ?? '',
    endereco: row?.endereco ?? '',
    logoUrl: row?.logo_url ?? '',
    corMarca: row?.cor_marca ?? '',
  }
}

/**
 * Ordem/visibilidade das linhas do cabeçalho da nota do resumo do dia —
 * mesma linha `configuracao_resumo_dia`, coluna à parte (`layout_campos`),
 * separada dos dados da empresa em si (esses vivem em "Dados da empresa").
 */
export async function getConfiguracaoLayoutResumo(): Promise<ConfiguracaoLayoutResumo> {
  const row = await db.query.configuracaoResumoDia.findFirst({
    where: (c, { eq }) => eq(c.id, 'default'),
    columns: { layout_campos: true },
  })

  if (!row?.layout_campos) return { campos: CAMPOS_RESUMO_PADRAO }

  const campos = row.layout_campos.filter(ehCampoResumoValido)
  return { campos: campos.length > 0 ? campos : CAMPOS_RESUMO_PADRAO }
}
