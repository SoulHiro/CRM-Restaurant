import { describe, expect, it } from 'vitest'

import {
  calcularDRE,
  despesaPorSubtipo,
  formatMes,
  mesAnterior,
  mesDe,
  mesSeguinte,
  receitaPorOrigem,
  transacoesDoMes,
} from './dre-helpers'
import type { Transacao } from './types'

function t(overrides: Partial<Transacao> = {}): Transacao {
  return {
    id: 'x1',
    tipo: 'receita',
    origem: 'manual',
    valor: 100,
    data: '2026-08-10',
    descricao: 'Venda',
    categoria: null,
    subtipo: null,
    origemTipo: null,
    origemId: null,
    responsavel: null,
    criadoEm: '2026-08-10T12:00:00.000Z',
    ...overrides,
  }
}

describe('calcularDRE', () => {
  it('soma receita, despesa e devolve o lucro', () => {
    const dre = calcularDRE([
      t({ tipo: 'receita', valor: 1200 }),
      t({ tipo: 'despesa', valor: 300, categoria: 'variavel' }),
    ])

    expect(dre.receita).toBe(1200)
    expect(dre.despesa).toBe(300)
    expect(dre.lucro).toBe(900)
    expect(dre.totalLancamentos).toBe(2)
  })

  it('devolve tudo zerado num mês sem lançamento', () => {
    expect(calcularDRE([])).toMatchObject({
      receita: 0,
      despesa: 0,
      lucro: 0,
      pontoEquilibrio: 0,
      totalLancamentos: 0,
    })
  })

  it('aceita lucro negativo sem inventar zero', () => {
    const dre = calcularDRE([
      t({ tipo: 'receita', valor: 500 }),
      t({ tipo: 'despesa', valor: 900, categoria: 'fixa' }),
    ])
    expect(dre.lucro).toBe(-400)
  })

  it('separa despesa fixa de variável', () => {
    const dre = calcularDRE([
      t({ tipo: 'despesa', valor: 10000, categoria: 'fixa' }),
      t({ tipo: 'despesa', valor: 2500, categoria: 'variavel' }),
      t({ tipo: 'despesa', valor: 500, categoria: 'fixa' }),
    ])

    expect(dre.despesaFixa).toBe(10500)
    expect(dre.despesaVariavel).toBe(2500)
    expect(dre.despesa).toBe(13000)
  })

  it('usa a despesa fixa como ponto de equilíbrio', () => {
    const dre = calcularDRE([
      t({ tipo: 'despesa', valor: 10000, categoria: 'fixa' }),
      t({ tipo: 'despesa', valor: 3000, categoria: 'variavel' }),
    ])
    expect(dre.pontoEquilibrio).toBe(10000)
  })

  it('não conta despesa sem categoria como fixa nem variável', () => {
    const dre = calcularDRE([t({ tipo: 'despesa', valor: 250 })])
    expect(dre.despesa).toBe(250)
    expect(dre.despesaFixa).toBe(0)
    expect(dre.despesaVariavel).toBe(0)
  })

  it('não deixa resíduo de float aparecer no total', () => {
    const dre = calcularDRE([
      t({ tipo: 'receita', valor: 0.1 }),
      t({ tipo: 'receita', valor: 0.2 }),
    ])
    expect(dre.receita).toBe(0.3)
  })

  it('funciona com só receita e com só despesa', () => {
    expect(calcularDRE([t({ tipo: 'receita', valor: 800 })]).lucro).toBe(800)
    expect(
      calcularDRE([t({ tipo: 'despesa', valor: 800, categoria: 'fixa' })]).lucro
    ).toBe(-800)
  })
})

describe('receitaPorOrigem', () => {
  it('agrupa só receita, com percentual, do maior pro menor', () => {
    const fatias = receitaPorOrigem([
      t({ tipo: 'receita', origem: 'ifood', valor: 250 }),
      t({ tipo: 'receita', origem: 'anotai', valor: 750 }),
      t({ tipo: 'despesa', origem: 'manual', valor: 999, categoria: 'fixa' }),
    ])

    expect(fatias).toEqual([
      { origem: 'anotai', valor: 750, percentual: 75 },
      { origem: 'ifood', valor: 250, percentual: 25 },
    ])
  })

  it('devolve lista vazia quando não houve receita', () => {
    expect(
      receitaPorOrigem([t({ tipo: 'despesa', valor: 10, categoria: 'fixa' })])
    ).toEqual([])
  })

  it('soma várias entradas da mesma origem', () => {
    const fatias = receitaPorOrigem([
      t({ tipo: 'receita', origem: 'ifood', valor: 100 }),
      t({ tipo: 'receita', origem: 'ifood', valor: 300 }),
    ])
    expect(fatias).toEqual([{ origem: 'ifood', valor: 400, percentual: 100 }])
  })
})

describe('despesaPorSubtipo', () => {
  it('agrupa despesa por subtipo, tratando ausente como "outro"', () => {
    const fatias = despesaPorSubtipo([
      t({ tipo: 'despesa', valor: 300, categoria: 'fixa', subtipo: 'aluguel' }),
      t({ tipo: 'despesa', valor: 100, categoria: 'variavel' }),
      t({ tipo: 'receita', valor: 999 }),
    ])

    expect(fatias).toEqual([
      { subtipo: 'aluguel', valor: 300, percentual: 75 },
      { subtipo: 'outro', valor: 100, percentual: 25 },
    ])
  })
})

describe('navegação de mês', () => {
  it('extrai o mês de uma data', () => {
    expect(mesDe('2026-08-10')).toBe('2026-08')
  })

  it('atravessa a virada de ano nos dois sentidos', () => {
    expect(mesAnterior('2026-01')).toBe('2025-12')
    expect(mesSeguinte('2026-12')).toBe('2027-01')
  })

  it('anda dentro do mesmo ano mantendo o zero à esquerda', () => {
    expect(mesAnterior('2026-10')).toBe('2026-09')
    expect(mesSeguinte('2026-08')).toBe('2026-09')
  })

  it('formata o mês em português com inicial maiúscula', () => {
    expect(formatMes('2026-08')).toMatch(/^Agosto de 2026$/)
  })

  it('filtra transações do mês pedido', () => {
    const transacoes = [
      t({ id: 'a', data: '2026-08-01' }),
      t({ id: 'b', data: '2026-08-31' }),
      t({ id: 'c', data: '2026-09-01' }),
      t({ id: 'd', data: '2026-07-31' }),
    ]

    expect(transacoesDoMes(transacoes, '2026-08').map((x) => x.id)).toEqual([
      'a',
      'b',
    ])
  })
})
