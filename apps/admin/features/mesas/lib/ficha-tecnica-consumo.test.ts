import { describe, expect, it } from 'vitest'

import { calcularConsumoInsumos } from './ficha-tecnica-consumo'

describe('calcularConsumoInsumos', () => {
  it('multiplica quantidade da linha pela quantidade vendida (sem tamanho)', () => {
    const resultado = calcularConsumoInsumos(
      [{ id: 'l1', estoqueItemId: 'pao', quantidade: 1, tipoEscala: 'fixo' }],
      [],
      3,
      null,
      null
    )
    expect(resultado).toEqual([{ estoqueItemId: 'pao', quantidade: 3 }])
  })

  it('aplica multiplicador de peso em linha proporcional', () => {
    const resultado = calcularConsumoInsumos(
      [{ id: 'l1', estoqueItemId: 'arroz', quantidade: 0.1, tipoEscala: 'proporcional' }],
      [],
      2,
      750,
      500
    )
    // 0.1 * (750/500) * 2 = 0.3
    expect(resultado[0]?.quantidade).toBeCloseTo(0.3)
  })

  it('usa override fixo do tamanho em vez da quantidade base', () => {
    const resultado = calcularConsumoInsumos(
      [{ id: 'l1', estoqueItemId: 'embalagem-p', quantidade: 1, tipoEscala: 'fixo' }],
      [{ fichaTecnicaItemId: 'l1', estoqueItemId: 'embalagem-g', quantidade: 1 }],
      2,
      750,
      500
    )
    expect(resultado).toEqual([{ estoqueItemId: 'embalagem-g', quantidade: 2 }])
  })

  it('soma linhas que resolvem pro mesmo insumo', () => {
    const resultado = calcularConsumoInsumos(
      [
        { id: 'l1', estoqueItemId: 'queijo', quantidade: 1, tipoEscala: 'fixo' },
        { id: 'l2', estoqueItemId: 'x', quantidade: 1, tipoEscala: 'fixo' },
      ],
      [{ fichaTecnicaItemId: 'l2', estoqueItemId: 'queijo', quantidade: 1 }],
      1,
      null,
      null
    )
    expect(resultado).toEqual([{ estoqueItemId: 'queijo', quantidade: 2 }])
  })
})
