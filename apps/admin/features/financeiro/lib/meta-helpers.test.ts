import { describe, expect, it } from 'vitest'

import { calcularProgressoMeta, diasEntre } from './meta-helpers'
import type { AjusteMeta, Meta, Transacao } from './types'

const META: Meta = {
  id: 'm1',
  descricao: 'Entrada do restaurante',
  tipo: 'financeira',
  valorAlvo: 360000,
  inicio: '2026-08-07',
  prazo: '2026-11-07',
  ativa: true,
}

function t(overrides: Partial<Transacao> = {}): Transacao {
  return {
    id: 'x1',
    tipo: 'receita',
    origem: 'manual',
    valor: 0,
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

function ajuste(valor: number, data = '2026-08-15'): AjusteMeta {
  return { id: `a-${valor}`, data, valor, observacao: null, criadoEm: data }
}

describe('diasEntre', () => {
  it('conta dias corridos entre duas datas', () => {
    expect(diasEntre('2026-08-07', '2026-11-07')).toBe(92)
  })

  it('devolve negativo quando a data final já passou', () => {
    expect(diasEntre('2026-08-10', '2026-08-01')).toBe(-9)
  })
})

describe('calcularProgressoMeta', () => {
  const hoje = '2026-08-07'

  it('soma o lucro do período como progresso automático', () => {
    const progresso = calcularProgressoMeta(
      META,
      [
        t({ tipo: 'receita', valor: 100000, data: '2026-08-10' }),
        t({ tipo: 'despesa', valor: 40000, data: '2026-08-12', categoria: 'fixa' }),
      ],
      [],
      hoje
    )

    expect(progresso.lucroPeriodo).toBe(60000)
    expect(progresso.acumulado).toBe(60000)
    expect(progresso.falta).toBe(300000)
  })

  it('ignora transação fora da janela da meta', () => {
    const progresso = calcularProgressoMeta(
      META,
      [
        t({ tipo: 'receita', valor: 50000, data: '2026-08-06' }), // antes do início
        t({ tipo: 'receita', valor: 70000, data: '2026-11-08' }), // depois do prazo
        t({ tipo: 'receita', valor: 10000, data: '2026-09-01' }), // dentro
      ],
      [],
      hoje
    )

    expect(progresso.acumulado).toBe(10000)
  })

  it('inclui as datas de início e prazo na janela', () => {
    const progresso = calcularProgressoMeta(
      META,
      [
        t({ tipo: 'receita', valor: 1000, data: '2026-08-07' }),
        t({ tipo: 'receita', valor: 1000, data: '2026-11-07' }),
      ],
      [],
      hoje
    )
    expect(progresso.acumulado).toBe(2000)
  })

  it('soma aporte manual ao progresso automático', () => {
    const progresso = calcularProgressoMeta(
      META,
      [t({ tipo: 'receita', valor: 60000, data: '2026-08-10' })],
      [ajuste(50000)],
      hoje
    )

    expect(progresso.lucroPeriodo).toBe(60000)
    expect(progresso.ajustes).toBe(50000)
    expect(progresso.acumulado).toBe(110000)
  })

  it('aceita retirada como ajuste negativo', () => {
    const progresso = calcularProgressoMeta(
      META,
      [t({ tipo: 'receita', valor: 60000, data: '2026-08-10' })],
      [ajuste(50000), ajuste(-20000)],
      hoje
    )

    expect(progresso.ajustes).toBe(30000)
    expect(progresso.acumulado).toBe(90000)
  })

  it('calcula percentual e o quanto falta', () => {
    const progresso = calcularProgressoMeta(
      META,
      [t({ tipo: 'receita', valor: 90000, data: '2026-08-10' })],
      [],
      hoje
    )

    expect(progresso.percentual).toBe(25)
    expect(progresso.falta).toBe(270000)
    expect(progresso.atingida).toBe(false)
  })

  it('marca como atingida e não deixa "falta" ficar negativo', () => {
    const progresso = calcularProgressoMeta(
      META,
      [t({ tipo: 'receita', valor: 400000, data: '2026-08-10' })],
      [],
      hoje
    )

    expect(progresso.atingida).toBe(true)
    expect(progresso.falta).toBe(0)
    expect(progresso.ritmoSemanal).toBe(0)
  })

  it('divide o que falta pelas semanas restantes', () => {
    // 92 dias → 14 semanas (arredondando pra cima)
    const progresso = calcularProgressoMeta(META, [], [], hoje)

    expect(progresso.diasRestantes).toBe(92)
    expect(progresso.semanasRestantes).toBe(14)
    expect(progresso.ritmoSemanal).toBe(
      Math.round((360000 / 14) * 100) / 100
    )
  })

  it('arredonda semana pra cima — 8 dias são 2 semanas, não 1', () => {
    const progresso = calcularProgressoMeta(META, [], [], '2026-10-30')
    expect(progresso.diasRestantes).toBe(8)
    expect(progresso.semanasRestantes).toBe(2)
  })

  it('meta vencida não gera dias nem semanas negativos', () => {
    const progresso = calcularProgressoMeta(META, [], [], '2026-12-01')

    expect(progresso.vencida).toBe(true)
    expect(progresso.diasRestantes).toBe(0)
    expect(progresso.semanasRestantes).toBe(0)
    // Sem semana restante, o que falta é tudo "para ontem".
    expect(progresso.ritmoSemanal).toBe(360000)
  })

  it('meta operacional (sem valor alvo) não quebra o cálculo', () => {
    const operacional: Meta = {
      ...META,
      tipo: 'operacional',
      valorAlvo: null,
      descricao: 'Reformar a área externa',
    }

    const progresso = calcularProgressoMeta(operacional, [], [], hoje)

    expect(progresso.percentual).toBe(0)
    expect(progresso.falta).toBe(0)
    expect(progresso.atingida).toBe(false)
  })
})
