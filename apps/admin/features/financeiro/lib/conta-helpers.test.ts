import { describe, expect, it } from 'vitest'

import {
  diasEmAtraso,
  filtrarContas,
  ordenarPorUrgencia,
  parseContaFiltro,
  resumirContas,
  rotuloPrazo,
  statusConta,
} from './conta-helpers'
import type { ContaPagar, ContaReceber } from './types'

function pagar(overrides: Partial<ContaPagar> = {}): ContaPagar {
  return {
    id: 'p1',
    descricao: 'Aluguel',
    categoria: 'fixa',
    subtipo: 'aluguel',
    valor: 10000,
    dataVencimento: '2026-08-10',
    status: 'pendente',
    dataPagamento: null,
    observacao: null,
    criadoEm: '2026-08-01T12:00:00.000Z',
    ...overrides,
  }
}

function receber(overrides: Partial<ContaReceber> = {}): ContaReceber {
  return {
    id: 'r1',
    empresaId: null,
    empresaNome: 'Metalúrgica X',
    periodo: '2026-08',
    valor: 4000,
    dataVencimento: '2026-08-10',
    status: 'pendente',
    dataPagamento: null,
    observacao: null,
    criadoEm: '2026-08-01T12:00:00.000Z',
    ...overrides,
  }
}

describe('statusConta', () => {
  it('conta paga continua paga mesmo com vencimento no passado', () => {
    expect(
      statusConta({ status: 'pago', dataVencimento: '2020-01-01' }, '2026-08-10')
    ).toBe('pago')
  })

  it('no dia do vencimento ainda é pendente, não atrasado', () => {
    expect(
      statusConta(
        { status: 'pendente', dataVencimento: '2026-08-10' },
        '2026-08-10'
      )
    ).toBe('pendente')
  })

  it('vira atrasado no dia seguinte ao vencimento', () => {
    expect(
      statusConta(
        { status: 'pendente', dataVencimento: '2026-08-10' },
        '2026-08-11'
      )
    ).toBe('atrasado')
  })

  it('vencimento futuro é pendente', () => {
    expect(
      statusConta(
        { status: 'pendente', dataVencimento: '2026-09-01' },
        '2026-08-10'
      )
    ).toBe('pendente')
  })
})

describe('diasEmAtraso', () => {
  it('devolve zero no próprio dia do vencimento', () => {
    expect(diasEmAtraso('2026-08-10', '2026-08-10')).toBe(0)
  })

  it('conta positivo quando já venceu', () => {
    expect(diasEmAtraso('2026-08-01', '2026-08-10')).toBe(9)
  })

  it('conta negativo quando ainda falta vencer', () => {
    expect(diasEmAtraso('2026-08-20', '2026-08-10')).toBe(-10)
  })

  it('atravessa virada de mês', () => {
    expect(diasEmAtraso('2026-07-31', '2026-08-02')).toBe(2)
  })

  it('atravessa virada de ano', () => {
    expect(diasEmAtraso('2025-12-30', '2026-01-02')).toBe(3)
  })

  it('cobre 29 de fevereiro em ano bissexto', () => {
    expect(diasEmAtraso('2028-02-28', '2028-03-01')).toBe(2)
  })
})

describe('rotuloPrazo', () => {
  it('escreve o prazo em linguagem do dia a dia', () => {
    expect(rotuloPrazo('2026-08-10', '2026-08-10')).toBe('Vence hoje')
    expect(rotuloPrazo('2026-08-11', '2026-08-10')).toBe('Vence amanhã')
    expect(rotuloPrazo('2026-08-09', '2026-08-10')).toBe('Venceu ontem')
    expect(rotuloPrazo('2026-08-01', '2026-08-10')).toBe('9 dias em atraso')
    expect(rotuloPrazo('2026-08-15', '2026-08-10')).toBe('Faltam 5 dias')
  })
})

describe('resumirContas', () => {
  const hoje = '2026-08-10'

  it('separa pendente de atrasado, ignorando o que já foi pago', () => {
    const resumo = resumirContas(
      [
        pagar({ id: 'a', valor: 10000, dataVencimento: '2026-08-01' }),
        pagar({ id: 'b', valor: 500, dataVencimento: '2026-08-20' }),
        pagar({ id: 'c', valor: 9999, status: 'pago' }),
      ],
      [
        receber({ id: 'd', valor: 4000, dataVencimento: '2026-08-05' }),
        receber({ id: 'e', valor: 1000, dataVencimento: '2026-08-30' }),
      ],
      hoje
    )

    expect(resumo.pagarPendente).toBe(10500)
    expect(resumo.pagarAtrasado).toBe(10000)
    expect(resumo.pagarAtrasadoQtd).toBe(1)
    expect(resumo.receberPendente).toBe(5000)
    expect(resumo.receberAtrasado).toBe(4000)
    expect(resumo.receberAtrasadoQtd).toBe(1)
  })

  it('zera tudo quando não há conta em aberto', () => {
    expect(resumirContas([], [], hoje)).toEqual({
      pagarPendente: 0,
      pagarAtrasado: 0,
      pagarAtrasadoQtd: 0,
      receberPendente: 0,
      receberAtrasado: 0,
      receberAtrasadoQtd: 0,
    })
  })
})

describe('ordenarPorUrgencia', () => {
  it('coloca o mais atrasado primeiro e joga o pago pro fim', () => {
    const ordenadas = ordenarPorUrgencia([
      pagar({ id: 'futuro', dataVencimento: '2026-09-01' }),
      pagar({ id: 'pago', dataVencimento: '2026-07-01', status: 'pago' }),
      pagar({ id: 'atrasado', dataVencimento: '2026-08-01' }),
    ])

    expect(ordenadas.map((c) => c.id)).toEqual(['atrasado', 'futuro', 'pago'])
  })
})

describe('filtrarContas', () => {
  const hoje = '2026-08-10'
  const contas = [
    pagar({ id: 'atrasada', dataVencimento: '2026-08-01' }),
    pagar({ id: 'pendente', dataVencimento: '2026-08-20' }),
    pagar({ id: 'paga', status: 'pago' }),
  ]

  it('devolve tudo em "todas"', () => {
    expect(filtrarContas(contas, 'todas', hoje)).toHaveLength(3)
  })

  it('filtra por cada status derivado', () => {
    expect(filtrarContas(contas, 'atrasado', hoje).map((c) => c.id)).toEqual([
      'atrasada',
    ])
    expect(filtrarContas(contas, 'pendente', hoje).map((c) => c.id)).toEqual([
      'pendente',
    ])
    expect(filtrarContas(contas, 'pago', hoje).map((c) => c.id)).toEqual([
      'paga',
    ])
  })
})

describe('parseContaFiltro', () => {
  it('aceita valor válido e descarta o resto', () => {
    expect(parseContaFiltro('atrasado')).toBe('atrasado')
    expect(parseContaFiltro('inventado')).toBe('todas')
    expect(parseContaFiltro(undefined)).toBe('todas')
    expect(parseContaFiltro(['a', 'b'])).toBe('todas')
  })
})
