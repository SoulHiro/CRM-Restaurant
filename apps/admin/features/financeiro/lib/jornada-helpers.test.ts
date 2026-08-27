import { describe, expect, it } from 'vitest'

import {
  filtrarContasPorJornada,
  formatJornada,
  jornadaAnterior,
  jornadaDe,
  jornadaSeguinte,
  normalizarJornadaInicio,
  resumoJornadaFinanceiro,
  totalPorJornada,
  ultimasJornadas,
} from './jornada-helpers'
import { variacaoPercentual } from './resumo-periodo-helpers'

describe('jornadaDe', () => {
  it('dia depois do corte (>= 6) pertence à jornada que começa nesse mês', () => {
    expect(jornadaDe('2026-08-26')).toEqual({
      inicio: '2026-08-06',
      fim: '2026-09-06',
    })
  })

  it('dia exatamente no corte já pertence à jornada que começa hoje', () => {
    expect(jornadaDe('2026-08-06')).toEqual({
      inicio: '2026-08-06',
      fim: '2026-09-06',
    })
  })

  it('dia antes do corte pertence à jornada do mês anterior', () => {
    expect(jornadaDe('2026-08-05')).toEqual({
      inicio: '2026-07-06',
      fim: '2026-08-06',
    })
  })

  it('vira o ano corretamente em dezembro/janeiro', () => {
    expect(jornadaDe('2026-01-02')).toEqual({
      inicio: '2025-12-06',
      fim: '2026-01-06',
    })
  })
})

describe('normalizarJornadaInicio', () => {
  it('força o dia pra DIA_CORTE, mesmo vindo de um valor salvo com o corte antigo', () => {
    expect(normalizarJornadaInicio('2026-08-05')).toBe('2026-08-06')
    expect(normalizarJornadaInicio('2026-08-06')).toBe('2026-08-06')
    expect(normalizarJornadaInicio('2026-08-20')).toBe('2026-08-06')
  })
})

describe('jornadaAnterior / jornadaSeguinte', () => {
  it('navega um mês pra trás e pra frente mantendo o dia 6', () => {
    expect(jornadaAnterior('2026-08-06')).toBe('2026-07-06')
    expect(jornadaSeguinte('2026-08-06')).toBe('2026-09-06')
  })

  it('vira o ano', () => {
    expect(jornadaSeguinte('2025-12-06')).toBe('2026-01-06')
    expect(jornadaAnterior('2026-01-06')).toBe('2025-12-06')
  })
})

describe('filtrarContasPorJornada', () => {
  const jornada = { inicio: '2026-08-06', fim: '2026-09-06' }
  const contas = [
    { id: 'antes', dataVencimento: '2026-08-05' },
    { id: 'inicio', dataVencimento: '2026-08-06' },
    { id: 'meio', dataVencimento: '2026-08-20' },
    { id: 'ultimo-dia', dataVencimento: '2026-09-05' },
    { id: 'fim-exclusivo', dataVencimento: '2026-09-06' },
  ]

  it('mantém só o que está dentro da jornada, com fim exclusivo', () => {
    expect(
      filtrarContasPorJornada(contas, jornada).map((c) => c.id)
    ).toEqual(['inicio', 'meio', 'ultimo-dia'])
  })
})

describe('totalPorJornada', () => {
  it('soma só o valor das contas dentro da jornada', () => {
    const jornada = { inicio: '2026-08-06', fim: '2026-09-06' }
    const contas = [
      { dataVencimento: '2026-08-10', valor: 100 },
      { dataVencimento: '2026-08-20', valor: 50 },
      { dataVencimento: '2026-09-20', valor: 999 },
    ]
    expect(totalPorJornada(contas, jornada)).toBe(150)
  })
})

describe('ultimasJornadas', () => {
  it('devolve N jornadas terminando na atual, da mais antiga pra mais nova', () => {
    expect(ultimasJornadas('2026-08-06', 3)).toEqual([
      '2026-06-06',
      '2026-07-06',
      '2026-08-06',
    ])
  })
})

describe('variacaoPercentual', () => {
  it('calcula a variação percentual normal', () => {
    expect(variacaoPercentual(120, 100)).toBe(20)
    expect(variacaoPercentual(80, 100)).toBe(-20)
  })

  it('sem base anterior (zero) e atual também zero, variação é zero', () => {
    expect(variacaoPercentual(0, 0)).toBe(0)
  })

  it('sem base anterior (zero) mas com valor atual, não dá pra calcular', () => {
    expect(variacaoPercentual(100, 0)).toBeNull()
  })
})

describe('resumoJornadaFinanceiro', () => {
  it('calcula atual, anterior, variação e histórico das últimas jornadas', () => {
    const contas = [
      { dataVencimento: '2026-06-10', valor: 100 },
      { dataVencimento: '2026-07-10', valor: 200 },
      { dataVencimento: '2026-08-10', valor: 300 },
    ]
    const resumo = resumoJornadaFinanceiro(contas, '2026-08-06', 3)

    expect(resumo.historico).toEqual([
      { label: '6 de jun.', total: 100 },
      { label: '6 de jul.', total: 200 },
      { label: '6 de ago.', total: 300 },
    ])
    expect(resumo.atual).toBe(300)
    expect(resumo.anterior).toBe(200)
    expect(resumo.variacao).toBe(50)
  })

  it('sem histórico suficiente, anterior fica zero', () => {
    const resumo = resumoJornadaFinanceiro(
      [{ dataVencimento: '2026-08-10', valor: 300 }],
      '2026-08-06',
      3
    )
    expect(resumo.anterior).toBe(0)
    expect(resumo.variacao).toBeNull()
  })
})

describe('formatJornada', () => {
  it('mostra o início e o último dia dentro da jornada (fim é exclusivo)', () => {
    expect(formatJornada({ inicio: '2026-08-06', fim: '2026-09-06' })).toBe(
      '6 de ago. – 5 de set. de 2026'
    )
  })
})
