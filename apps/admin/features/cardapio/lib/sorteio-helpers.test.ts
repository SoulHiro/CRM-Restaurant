import { describe, expect, it } from 'vitest'

import {
  diasFixosFeijoada,
  diasSegundaASabado,
  gerarCardapioMes,
} from './sorteio-helpers'

function rngSequencial(): () => number {
  const valores = [
    0.1, 0.9, 0.3, 0.7, 0.5, 0.2, 0.8, 0.4, 0.6, 0.05, 0.95, 0.35,
  ]
  let i = 0
  return () => valores[i++ % valores.length]!
}

const PRATOS = Array.from({ length: 6 }, (_, i) => ({
  id: `p${i}`,
  nome: `Prato ${i}`,
}))

describe('diasFixosFeijoada', () => {
  it('marca toda quarta e sábado do intervalo, mais nenhum outro dia', () => {
    // 24/08/2026 = segunda, 26 = quarta, 29 = sábado
    const dias = [
      '2026-08-24',
      '2026-08-25',
      '2026-08-26',
      '2026-08-27',
      '2026-08-28',
      '2026-08-29',
    ]
    const fixos = diasFixosFeijoada(dias, 'feijoada-id')

    expect(fixos.map((f) => f.data)).toEqual(['2026-08-26', '2026-08-29'])
    expect(fixos.every((f) => f.pratoId === 'feijoada-id')).toBe(true)
  })

  it('intervalo sem quarta nem sábado não marca nada', () => {
    expect(
      diasFixosFeijoada(['2026-08-24', '2026-08-25'], 'feijoada-id')
    ).toEqual([])
  })
})

describe('diasSegundaASabado', () => {
  it('exclui domingo do intervalo', () => {
    // 2026-08-24 (segunda) a 2026-08-30 (domingo)
    const dias = diasSegundaASabado('2026-08-24', '2026-08-30')
    expect(dias).toEqual([
      '2026-08-24',
      '2026-08-25',
      '2026-08-26',
      '2026-08-27',
      '2026-08-28',
      '2026-08-29',
    ])
  })
})

describe('gerarCardapioMes', () => {
  it('dia fixo sempre usa o prato configurado como destaque', () => {
    const dias = ['2026-08-24', '2026-08-25', '2026-08-26']
    const fixos = [{ data: '2026-08-26', pratoId: 'p0' }]

    const resultado = gerarCardapioMes(PRATOS, dias, fixos, 3, rngSequencial())

    expect(resultado.get('2026-08-26')!.destaqueId).toBe('p0')
  })

  it('não repete destaque entre dias livres enquanto o catálogo permite', () => {
    const dias = ['2026-08-24', '2026-08-25', '2026-08-26', '2026-08-27']
    const resultado = gerarCardapioMes(PRATOS, dias, [], 3, rngSequencial())

    const destaques = dias.map((d) => resultado.get(d)!.destaqueId)
    expect(new Set(destaques).size).toBe(destaques.length)
  })

  it('catálogo menor que os dias livres passa a repetir em vez de quebrar', () => {
    const pratosPoucos = PRATOS.slice(0, 2)
    const dias = ['2026-08-24', '2026-08-25', '2026-08-26', '2026-08-27']

    const resultado = gerarCardapioMes(
      pratosPoucos,
      dias,
      [],
      2,
      rngSequencial()
    )

    expect(resultado.size).toBe(4)
    for (const dia of dias) {
      expect(pratosPoucos.map((p) => p.id)).toContain(
        resultado.get(dia)!.destaqueId
      )
    }
  })

  it('alternativas nunca incluem o destaque do mesmo dia', () => {
    const dias = ['2026-08-24', '2026-08-25']
    const resultado = gerarCardapioMes(PRATOS, dias, [], 4, rngSequencial())

    for (const dia of dias) {
      const { destaqueId, alternativaIds } = resultado.get(dia)!
      expect(alternativaIds).not.toContain(destaqueId)
    }
  })

  it('quantidade de alternativas respeita itensPorDia - 1, sem passar do catálogo disponível', () => {
    const dias = ['2026-08-24']
    const resultado = gerarCardapioMes(PRATOS, dias, [], 4, rngSequencial())

    expect(resultado.get('2026-08-24')!.alternativaIds).toHaveLength(3)
  })

  it('gera uma entrada por dia pedido', () => {
    const dias = [
      '2026-08-24',
      '2026-08-25',
      '2026-08-26',
      '2026-08-27',
      '2026-08-28',
    ]
    const resultado = gerarCardapioMes(PRATOS, dias, [], 3, rngSequencial())

    expect(resultado.size).toBe(5)
  })
})
