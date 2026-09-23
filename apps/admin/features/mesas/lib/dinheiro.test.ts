import { describe, expect, it } from 'vitest'

import {
  centavosParaReais,
  dividirCentavosIgualmente,
  parseReaisParaCentavos,
  reaisParaCentavos,
  somarCentavos,
} from './dinheiro'

describe('reaisParaCentavos/centavosParaReais', () => {
  it('converte nos dois sentidos sem resíduo de float', () => {
    expect(reaisParaCentavos(45)).toBe(4500)
    expect(reaisParaCentavos(42.3)).toBe(4230)
    expect(reaisParaCentavos(0.1 + 0.2)).toBe(30)
    expect(centavosParaReais(4500)).toBe(45)
  })
})

describe('dividirCentavosIgualmente', () => {
  it('divide sem perder nem sobrar centavo, resto vai pra primeira linha', () => {
    expect(dividirCentavosIgualmente(10000, 3)).toEqual([3334, 3333, 3333])
    expect(somarCentavos(dividirCentavosIgualmente(10000, 3))).toBe(10000)
  })

  it('divide exato quando dá certo', () => {
    expect(dividirCentavosIgualmente(4000, 4)).toEqual([1000, 1000, 1000, 1000])
  })

  it('devolve vazio para partes <= 0', () => {
    expect(dividirCentavosIgualmente(1000, 0)).toEqual([])
  })

  it('funciona com 1 pessoa (identidade)', () => {
    expect(dividirCentavosIgualmente(4567, 1)).toEqual([4567])
  })
})

describe('parseReaisParaCentavos', () => {
  it('aceita vírgula, ponto e inteiro', () => {
    expect(parseReaisParaCentavos('45,00')).toBe(4500)
    expect(parseReaisParaCentavos('45.00')).toBe(4500)
    expect(parseReaisParaCentavos('45')).toBe(4500)
  })

  it('devolve 0 pra entrada inválida ou negativa', () => {
    expect(parseReaisParaCentavos('abc')).toBe(0)
    expect(parseReaisParaCentavos('-10')).toBe(0)
    expect(parseReaisParaCentavos('')).toBe(0)
  })
})
