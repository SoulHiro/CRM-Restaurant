import { describe, expect, it } from 'vitest'

import {
  calcularDiferenca,
  linhasParaAjustar,
  resumirContagem,
} from './inventario-helpers'
import type { InventarioLinha } from './types'

function linha(overrides: Partial<InventarioLinha> = {}): InventarioLinha {
  return {
    id: 'l1',
    itemId: 'i1',
    itemNome: 'Arroz',
    unidade: 'kg',
    quantidadeSistema: 10,
    quantidadeContada: null,
    diferenca: null,
    ...overrides,
  }
}

describe('calcularDiferenca', () => {
  it('devolve negativo quando faltou no físico', () => {
    expect(calcularDiferenca(7, 9)).toBe(-2)
  })

  it('devolve positivo quando sobrou no físico', () => {
    expect(calcularDiferenca(12, 9)).toBe(3)
  })

  it('devolve zero na contagem exata', () => {
    expect(calcularDiferenca(9, 9)).toBe(0)
  })

  it('não deixa resíduo de float virar divergência falsa', () => {
    expect(calcularDiferenca(0.3, 0.1)).toBe(0.2)
    expect(calcularDiferenca(1.1, 1.1)).toBe(0)
  })

  it('preserva as 3 casas do numeric(12,3)', () => {
    expect(calcularDiferenca(10.125, 10)).toBe(0.125)
  })
})

describe('resumirContagem', () => {
  it('não conta linha ainda não contada como divergente', () => {
    const resumo = resumirContagem([
      linha({ id: 'a' }),
      linha({ id: 'b', quantidadeContada: 10, diferenca: 0 }),
    ])

    expect(resumo).toMatchObject({
      totalLinhas: 2,
      linhasContadas: 1,
      linhasPendentes: 1,
      linhasDivergentes: 0,
      completo: false,
    })
  })

  it('trata contagem zero como contada, não como pendente', () => {
    const resumo = resumirContagem([
      linha({ quantidadeContada: 0, diferenca: -10 }),
    ])

    expect(resumo.linhasContadas).toBe(1)
    expect(resumo.linhasPendentes).toBe(0)
    expect(resumo.linhasDivergentes).toBe(1)
  })

  it('separa sobra de falta em valores absolutos', () => {
    const resumo = resumirContagem([
      linha({ id: 'a', quantidadeContada: 12, diferenca: 2 }),
      linha({ id: 'b', quantidadeContada: 7, diferenca: -3 }),
      linha({ id: 'c', quantidadeContada: 1.5, diferenca: 0.5 }),
    ])

    expect(resumo.sobra).toBe(2.5)
    expect(resumo.falta).toBe(3)
    expect(resumo.linhasDivergentes).toBe(3)
    expect(resumo.completo).toBe(true)
  })

  it('não considera completo um inventário sem linhas', () => {
    expect(resumirContagem([])).toMatchObject({
      totalLinhas: 0,
      completo: false,
    })
  })
})

describe('linhasParaAjustar', () => {
  it('devolve só as contadas com diferença diferente de zero', () => {
    const linhas = [
      linha({ id: 'pendente' }),
      linha({ id: 'exata', quantidadeContada: 10, diferenca: 0 }),
      linha({ id: 'falta', quantidadeContada: 8, diferenca: -2 }),
      linha({ id: 'sobra', quantidadeContada: 11, diferenca: 1 }),
    ]

    expect(linhasParaAjustar(linhas).map((l) => l.id)).toEqual([
      'falta',
      'sobra',
    ])
  })
})
