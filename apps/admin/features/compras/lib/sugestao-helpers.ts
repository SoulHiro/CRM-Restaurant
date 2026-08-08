import { arredondarMoeda } from '@/lib/numeric'

import type { SugestaoGrupo, SugestaoItem } from './types'

export const SEM_FORNECEDOR = 'Sem fornecedor definido'

interface ItemReponivel {
  estoqueItemId: string
  nome: string
  unidade: SugestaoItem['unidade']
  tamanhoEmbalagem: number | null
  quantidadeAtual: number
  pontoReposicao: number
  ultimoPreco: number | null
  fornecedorId: string | null
  fornecedorNome: string | null
}

function quantoFalta(item: ItemReponivel): number {
  return Math.round((item.pontoReposicao - item.quantidadeAtual) * 1000) / 1000
}

/**
 * A sugestão é o ponto de reposição lido ao contrário: item no ponto ou acima
 * dele não precisa de compra e simplesmente não entra na lista.
 */
export function montarSugestao(itens: readonly ItemReponivel[]): SugestaoItem[] {
  return itens
    .filter((item) => item.pontoReposicao > 0 && quantoFalta(item) > 0)
    .map((item) => ({ ...item, faltam: quantoFalta(item) }))
    .sort((a, b) => {
      const zeradoA = a.quantidadeAtual <= 0 ? 0 : 1
      const zeradoB = b.quantidadeAtual <= 0 ? 0 : 1
      if (zeradoA !== zeradoB) return zeradoA - zeradoB
      return a.nome.localeCompare(b.nome, 'pt-BR')
    })
}

/**
 * Agrupa por fornecedor padrão porque é assim que o pedido acontece na vida
 * real: uma ligação por fornecedor, não uma por item.
 */
export function agruparPorFornecedor(
  itens: readonly SugestaoItem[]
): SugestaoGrupo[] {
  const grupos = new Map<string, SugestaoGrupo>()

  for (const item of itens) {
    const chave = item.fornecedorId ?? ''
    let grupo = grupos.get(chave)

    if (!grupo) {
      grupo = {
        fornecedorId: item.fornecedorId,
        fornecedorNome: item.fornecedorNome ?? SEM_FORNECEDOR,
        itens: [],
        custoEstimado: 0,
      }
      grupos.set(chave, grupo)
    }

    grupo.itens.push(item)
    if (item.ultimoPreco != null) {
      grupo.custoEstimado = arredondarMoeda(
        grupo.custoEstimado + item.faltam * item.ultimoPreco
      )
    }
  }

  // Fornecedor conhecido primeiro: o grupo "sem fornecedor" é pendência de
  // cadastro, não um pedido que dá para fazer agora.
  return [...grupos.values()].sort((a, b) => {
    if (a.fornecedorId == null) return 1
    if (b.fornecedorId == null) return -1
    return a.fornecedorNome.localeCompare(b.fornecedorNome, 'pt-BR')
  })
}
