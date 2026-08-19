import { describe, expect, it } from 'vitest'

import {
  agruparParaPesagem,
  calcularArrozGramas,
  calcularFeijaoGramas,
  contarPorPrato,
  montarResumoPesagemGrupo,
} from './pesagem-helpers'
import type { PedidoDoDiaItem } from './types'

function pedido(overrides: Partial<PedidoDoDiaItem>): PedidoDoDiaItem {
  return {
    colaboradorId: 'c1',
    nome: 'Fulano',
    whatsapp: null,
    tipo: 'marmita',
    turno: null,
    tamanho: null,
    prato: 'Frango grelhado',
    preco: null,
    observacao: null,
    respondidoEm: null,
    recusou: false,
    importadoEm: '2026-08-17T00:00:00.000Z',
    impressoEm: null,
    ...overrides,
  }
}

describe('calcularArrozGramas', () => {
  it('bate com o CONTROLE DE PESAGEM real: 39 pessoas -> 9360g', () => {
    expect(calcularArrozGramas(39)).toBe(9360)
  })

  it('bate com o exemplo do usuário: 40 pessoas -> 9600g', () => {
    expect(calcularArrozGramas(40)).toBe(9600)
  })

  it('16 pessoas -> 3840g', () => {
    expect(calcularArrozGramas(16)).toBe(3840)
  })
})

describe('calcularFeijaoGramas', () => {
  it('bate com o CONTROLE DE PESAGEM real: 16 pessoas -> 1920g', () => {
    expect(calcularFeijaoGramas(16)).toBe(1920)
  })

  it('39 pessoas -> 4680g', () => {
    expect(calcularFeijaoGramas(39)).toBe(4680)
  })
})

describe('contarPorPrato', () => {
  it('conta quantas pessoas escolheram cada prato, maior primeiro', () => {
    const pedidos = [
      pedido({ prato: 'Frango à passarinho' }),
      pedido({ prato: 'Parmegiana' }),
      pedido({ prato: 'Parmegiana' }),
    ]

    expect(contarPorPrato(pedidos)).toEqual([
      { prato: 'Parmegiana', quantidade: 2 },
      { prato: 'Frango à passarinho', quantidade: 1 },
    ])
  })

  it('quem recusou não conta', () => {
    const pedidos = [
      pedido({ prato: 'Parmegiana' }),
      pedido({ prato: 'Parmegiana', recusou: true }),
    ]

    expect(contarPorPrato(pedidos)).toEqual([
      { prato: 'Parmegiana', quantidade: 1 },
    ])
  })
})

describe('agruparParaPesagem', () => {
  it('separa 1º turno/administrativo (grupo A), 2º turno (grupo B) e 3º turno (individual)', () => {
    const pedidos = [
      pedido({ colaboradorId: 'a1', turno: '1_turno' }),
      pedido({ colaboradorId: 'a2', turno: 'administrativo' }),
      pedido({ colaboradorId: 'b1', turno: '2_turno' }),
      pedido({ colaboradorId: 'c1', turno: '3_turno' }),
    ]

    const { individual, grupoA, grupoB } = agruparParaPesagem(pedidos, new Set())

    expect(grupoA.map((p) => p.colaboradorId)).toEqual(['a1', 'a2'])
    expect(grupoB.map((p) => p.colaboradorId)).toEqual(['b1'])
    expect(individual.map((p) => p.colaboradorId)).toEqual(['c1'])
  })

  it('colaborador marcado como separado vira individual mesmo no 1º turno', () => {
    const pedidos = [
      pedido({ colaboradorId: 'vermelho', turno: '1_turno' }),
      pedido({ colaboradorId: 'normal', turno: '1_turno' }),
    ]

    const { individual, grupoA } = agruparParaPesagem(
      pedidos,
      new Set(['vermelho'])
    )

    expect(individual.map((p) => p.colaboradorId)).toEqual(['vermelho'])
    expect(grupoA.map((p) => p.colaboradorId)).toEqual(['normal'])
  })

  it('turno de fluxo padrão (almoço/jantar) não entra em nenhum grupo de pesagem', () => {
    const pedidos = [pedido({ turno: 'almoco' })]

    const { individual, grupoA, grupoB } = agruparParaPesagem(pedidos, new Set())

    expect(individual).toEqual([])
    expect(grupoA).toEqual([])
    expect(grupoB).toEqual([])
  })
})

describe('montarResumoPesagemGrupo', () => {
  it('monta headcount, arroz/feijão e itens de um grupo', () => {
    const pedidos = Array.from({ length: 39 }, (_, i) =>
      pedido({ colaboradorId: `c${i}`, prato: i < 20 ? 'Arroz A' : 'Arroz B' })
    )

    const resumo = montarResumoPesagemGrupo(pedidos)

    expect(resumo.totalPessoas).toBe(39)
    expect(resumo.arrozGramas).toBe(9360)
    expect(resumo.feijaoGramas).toBe(4680)
    expect(resumo.itens).toEqual([
      { prato: 'Arroz A', quantidade: 20 },
      { prato: 'Arroz B', quantidade: 19 },
    ])
  })

  it('quem recusou não conta no headcount', () => {
    const pedidos = [pedido({}), pedido({ colaboradorId: 'c2', recusou: true })]

    expect(montarResumoPesagemGrupo(pedidos).totalPessoas).toBe(1)
  })
})
