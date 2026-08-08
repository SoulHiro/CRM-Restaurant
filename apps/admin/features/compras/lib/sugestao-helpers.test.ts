import { describe, expect, it } from 'vitest'

import {
  agruparPorFornecedor,
  montarSugestao,
  SEM_FORNECEDOR,
} from './sugestao-helpers'
import type { SugestaoItem } from './types'

function item(over: Partial<SugestaoItem> = {}): SugestaoItem {
  return {
    estoqueItemId: 'i1',
    nome: 'Óleo de soja',
    unidade: 'un',
    tamanhoEmbalagem: 900,
    quantidadeAtual: 2,
    pontoReposicao: 10,
    faltam: 8,
    ultimoPreco: 9,
    fornecedorId: 'f1',
    fornecedorNome: 'Atacadão Central',
    ...over,
  }
}

describe('montarSugestao', () => {
  it('calcula quanto falta para voltar ao ponto', () => {
    const [sugerido] = montarSugestao([item({ quantidadeAtual: 2, pontoReposicao: 10 })])
    expect(sugerido?.faltam).toBe(8)
  })

  it('não sugere item acima do ponto de reposição', () => {
    expect(
      montarSugestao([item({ quantidadeAtual: 12, pontoReposicao: 10 })])
    ).toHaveLength(0)
  })

  it('não sugere item exatamente no ponto', () => {
    expect(
      montarSugestao([item({ quantidadeAtual: 10, pontoReposicao: 10 })])
    ).toHaveLength(0)
  })

  it('ignora item sem ponto de reposição definido', () => {
    expect(
      montarSugestao([item({ quantidadeAtual: 0, pontoReposicao: 0 })])
    ).toHaveLength(0)
  })

  it('sugere o ponto inteiro quando o item está zerado', () => {
    const [sugerido] = montarSugestao([item({ quantidadeAtual: 0, pontoReposicao: 10 })])
    expect(sugerido?.faltam).toBe(10)
  })

  it('põe o que zerou na frente, depois em ordem alfabética', () => {
    const nomes = montarSugestao([
      item({ estoqueItemId: 'b', nome: 'Batata', quantidadeAtual: 3 }),
      item({ estoqueItemId: 'a', nome: 'Arroz', quantidadeAtual: 1 }),
      item({ estoqueItemId: 'z', nome: 'Zíper', quantidadeAtual: 0 }),
    ]).map((s) => s.nome)

    expect(nomes).toEqual(['Zíper', 'Arroz', 'Batata'])
  })

  it('arredonda quantidade decimal sem resíduo de float', () => {
    const [sugerido] = montarSugestao([
      item({ quantidadeAtual: 0.1, pontoReposicao: 0.3 }),
    ])
    expect(sugerido?.faltam).toBe(0.2)
  })
})

describe('agruparPorFornecedor', () => {
  it('junta itens do mesmo fornecedor num grupo só', () => {
    const grupos = agruparPorFornecedor([
      item({ estoqueItemId: 'a' }),
      item({ estoqueItemId: 'b', nome: 'Arroz' }),
    ])

    expect(grupos).toHaveLength(1)
    expect(grupos[0]?.itens).toHaveLength(2)
  })

  it('separa fornecedores diferentes', () => {
    const grupos = agruparPorFornecedor([
      item({ fornecedorId: 'f1', fornecedorNome: 'Atacadão Central' }),
      item({ estoqueItemId: 'b', fornecedorId: 'f2', fornecedorNome: 'Hortifruti' }),
    ])

    expect(grupos.map((g) => g.fornecedorNome)).toEqual([
      'Atacadão Central',
      'Hortifruti',
    ])
  })

  it('joga item sem fornecedor padrão num grupo próprio, por último', () => {
    const grupos = agruparPorFornecedor([
      item({ estoqueItemId: 'a', fornecedorId: null, fornecedorNome: null }),
      item({ estoqueItemId: 'b', fornecedorId: 'f1', fornecedorNome: 'Atacadão Central' }),
    ])

    expect(grupos.map((g) => g.fornecedorNome)).toEqual([
      'Atacadão Central',
      SEM_FORNECEDOR,
    ])
  })

  it('estima o custo pelo último preço pago', () => {
    const grupos = agruparPorFornecedor([
      item({ estoqueItemId: 'a', faltam: 8, ultimoPreco: 9 }),
      item({ estoqueItemId: 'b', faltam: 5, ultimoPreco: 20 }),
    ])

    expect(grupos[0]?.custoEstimado).toBe(172)
  })

  it('não conta item sem preço conhecido na estimativa', () => {
    const grupos = agruparPorFornecedor([
      item({ estoqueItemId: 'a', faltam: 8, ultimoPreco: 9 }),
      item({ estoqueItemId: 'b', faltam: 5, ultimoPreco: null }),
    ])

    expect(grupos[0]?.custoEstimado).toBe(72)
  })

  it('devolve lista vazia sem itens', () => {
    expect(agruparPorFornecedor([])).toEqual([])
  })
})
