import { describe, expect, it } from 'vitest'

import {
  calcularCustoInsumos,
  calcularCustoProducao,
  calcularFaixasPreco,
  calcularMargemPercentual,
  corMargem,
} from './precificacao-helpers'

const LIMIARES = { amareloPct: 0, verdePct: 30, azulPct: 100, roxoPct: 200 }

describe('calcularCustoInsumos', () => {
  it('soma quantidade × custo unitário de cada linha', () => {
    const custo = calcularCustoInsumos([
      { quantidade: 0.2, custoUnitario: 10 }, // 2
      { quantidade: 1, custoUnitario: 3.5 }, // 3.5
    ])
    expect(custo).toBeCloseTo(5.5)
  })

  it('lista vazia dá custo zero', () => {
    expect(calcularCustoInsumos([])).toBe(0)
  })
})

describe('calcularCustoProducao', () => {
  it('soma custo de insumos com custo operacional proporcional ao tempo', () => {
    // 10 min * 0,50/min = 5, + 8 de insumo = 13
    expect(calcularCustoProducao(8, 10, 0.5)).toBeCloseTo(13)
  })

  it('sem tempo de preparo, custo é só o de insumos', () => {
    expect(calcularCustoProducao(8, 0, 0.5)).toBe(8)
  })
})

describe('calcularFaixasPreco', () => {
  it('mínimo de sobrevivência é exatamente o custo de produção', () => {
    const faixas = calcularFaixasPreco(20, { minimaPct: 30, maximaPct: 100 })
    expect(faixas.minimoSobrevivencia).toBe(20)
  })

  it('mínimo e máximo recomendado aplicam a margem sobre o custo', () => {
    const faixas = calcularFaixasPreco(20, { minimaPct: 30, maximaPct: 100 })
    expect(faixas.minimoRecomendado).toBeCloseTo(26) // 20 * 1.3
    expect(faixas.maximoRecomendado).toBeCloseTo(40) // 20 * 2.0
  })
})

describe('calcularMargemPercentual', () => {
  it('preço igual ao custo é 0% de margem', () => {
    expect(calcularMargemPercentual(20, 20)).toBe(0)
  })

  it('preço acima do custo calcula a margem corretamente', () => {
    expect(calcularMargemPercentual(26, 20)).toBeCloseTo(30)
  })

  it('preço abaixo do custo dá margem negativa', () => {
    expect(calcularMargemPercentual(15, 20)).toBeCloseTo(-25)
  })

  it('custo de produção zero não divide por zero', () => {
    expect(calcularMargemPercentual(10, 0)).toBe(0)
  })
})

describe('corMargem', () => {
  it('margem negativa ou zero é vermelho', () => {
    expect(corMargem(-10, LIMIARES)).toBe('vermelho')
    expect(corMargem(0, LIMIARES)).toBe('vermelho')
  })

  it('acima do limiar amarelo até o verde é amarelo', () => {
    expect(corMargem(0.01, LIMIARES)).toBe('amarelo')
    expect(corMargem(30, LIMIARES)).toBe('amarelo')
  })

  it('acima do limiar verde até o azul é verde', () => {
    expect(corMargem(30.01, LIMIARES)).toBe('verde')
    expect(corMargem(100, LIMIARES)).toBe('verde')
  })

  it('acima do limiar azul até o roxo é azul', () => {
    expect(corMargem(100.01, LIMIARES)).toBe('azul')
    expect(corMargem(200, LIMIARES)).toBe('azul')
  })

  it('acima do limiar roxo é roxo', () => {
    expect(corMargem(200.01, LIMIARES)).toBe('roxo')
    expect(corMargem(1000, LIMIARES)).toBe('roxo')
  })
})
