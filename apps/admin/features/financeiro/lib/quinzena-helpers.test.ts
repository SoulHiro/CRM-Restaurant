import { describe, expect, it } from 'vitest'

import {
  filtrarContasPorQuinzena,
  formatDataPagamento,
  formatQuinzena,
  quinzenaAnterior,
  quinzenaAtual,
  quinzenaDe,
  quinzenaDeChave,
  quinzenaParaChave,
  quinzenaSeguinte,
  resumoQuinzenaFinanceiro,
  totalPorQuinzena,
} from './quinzena-helpers'

describe('quinzenaDe', () => {
  it('quinzena 1 vai do dia 1 ao dia 15', () => {
    expect(quinzenaDe(2026, 8, 1)).toMatchObject({
      inicio: '2026-08-01',
      fim: '2026-08-15',
      dataEmissao: '2026-08-15',
    })
  })

  it('quinzena 2 vai do dia 16 até o último dia do mês', () => {
    expect(quinzenaDe(2026, 8, 2)).toMatchObject({
      inicio: '2026-08-16',
      fim: '2026-08-31',
      dataEmissao: '2026-08-31',
    })
  })

  it('quinzena 2 respeita mês de 30 dias e fevereiro', () => {
    expect(quinzenaDe(2026, 9, 2).fim).toBe('2026-09-30')
    expect(quinzenaDe(2026, 2, 2).fim).toBe('2026-02-28')
    expect(quinzenaDe(2028, 2, 2).fim).toBe('2028-02-29') // bissexto
  })

  it('data de pagamento é a próxima quarta-feira a partir da emissão', () => {
    // 15/08/2026 é um sábado — próxima quarta é 19/08/2026
    expect(quinzenaDe(2026, 8, 1).dataPagamento).toBe('2026-08-19')
    // 31/08/2026 é uma segunda — próxima quarta é 02/09/2026
    expect(quinzenaDe(2026, 8, 2).dataPagamento).toBe('2026-09-02')
  })

  it('quando a emissão já cai numa quarta, o pagamento é no mesmo dia', () => {
    // 30/09/2026 é uma quarta-feira
    expect(quinzenaDe(2026, 9, 2).dataPagamento).toBe('2026-09-30')
  })
})

describe('quinzenaAnterior / quinzenaSeguinte', () => {
  it('anda entre as duas quinzenas do mesmo mês', () => {
    const q2 = quinzenaDe(2026, 8, 2)
    expect(quinzenaAnterior(q2)).toMatchObject({ ano: 2026, mes: 8, numero: 1 })
    const q1 = quinzenaDe(2026, 8, 1)
    expect(quinzenaSeguinte(q1)).toMatchObject({ ano: 2026, mes: 8, numero: 2 })
  })

  it('cruza o mês (e o ano) corretamente', () => {
    const q1Agosto = quinzenaDe(2026, 8, 1)
    expect(quinzenaAnterior(q1Agosto)).toMatchObject({
      ano: 2026,
      mes: 7,
      numero: 2,
    })
    const q2Dezembro = quinzenaDe(2026, 12, 2)
    expect(quinzenaSeguinte(q2Dezembro)).toMatchObject({
      ano: 2027,
      mes: 1,
      numero: 1,
    })
  })
})

describe('quinzenaAtual', () => {
  it('antes do dia 15, a última fechada é a quinzena 2 do mês anterior', () => {
    expect(quinzenaAtual('2026-08-10')).toMatchObject({
      ano: 2026,
      mes: 7,
      numero: 2,
    })
  })

  it('no dia 15 (dia da emissão), já conta como fechada', () => {
    expect(quinzenaAtual('2026-08-15')).toMatchObject({
      ano: 2026,
      mes: 8,
      numero: 1,
    })
  })

  it('entre o dia 16 e o penúltimo dia, a fechada é a quinzena 1', () => {
    expect(quinzenaAtual('2026-08-25')).toMatchObject({
      ano: 2026,
      mes: 8,
      numero: 1,
    })
  })

  it('no último dia do mês, a quinzena 2 já conta como fechada', () => {
    expect(quinzenaAtual('2026-08-31')).toMatchObject({
      ano: 2026,
      mes: 8,
      numero: 2,
    })
  })
})

describe('quinzenaParaChave / quinzenaDeChave', () => {
  it('faz o roundtrip sem perder informação', () => {
    const quinzena = quinzenaDe(2026, 8, 1)
    const chave = quinzenaParaChave(quinzena)
    expect(chave).toBe('2026-08-1')
    expect(quinzenaDeChave(chave)).toEqual(quinzena)
  })

  it('chave inválida devolve null', () => {
    expect(quinzenaDeChave('lixo')).toBeNull()
    expect(quinzenaDeChave('2026-08-3')).toBeNull()
  })
})

describe('filtrarContasPorQuinzena / totalPorQuinzena', () => {
  const quinzena = quinzenaDe(2026, 8, 1)
  const contas = [
    { dataVencimento: '2026-07-31', valor: 1 },
    { dataVencimento: '2026-08-01', valor: 10 },
    { dataVencimento: '2026-08-15', valor: 20 },
    { dataVencimento: '2026-08-16', valor: 999 },
  ]

  it('mantém início e fim inclusive', () => {
    expect(
      filtrarContasPorQuinzena(contas, quinzena).map((c) => c.valor)
    ).toEqual([10, 20])
  })

  it('soma só o que está dentro da quinzena', () => {
    expect(totalPorQuinzena(contas, quinzena)).toBe(30)
  })
})

describe('resumoQuinzenaFinanceiro', () => {
  it('compara a quinzena atual com a anterior e monta o histórico', () => {
    const contas = [
      { dataVencimento: '2026-07-10', valor: 100 }, // quinzena 1 de julho
      { dataVencimento: '2026-07-20', valor: 200 }, // quinzena 2 de julho
      { dataVencimento: '2026-08-10', valor: 300 }, // quinzena 1 de agosto
    ]
    const resumo = resumoQuinzenaFinanceiro(contas, quinzenaDe(2026, 8, 1), 3)

    expect(resumo.historico.map((p) => p.total)).toEqual([100, 200, 300])
    expect(resumo.atual).toBe(300)
    expect(resumo.anterior).toBe(200)
    expect(resumo.variacao).toBe(50)
  })
})

describe('formatQuinzena / formatDataPagamento', () => {
  it('formata o período e a data de pagamento por extenso', () => {
    const quinzena = quinzenaDe(2026, 8, 1)
    expect(formatQuinzena(quinzena)).toBe('1 de ago. – 15 de ago.')
    expect(formatDataPagamento(quinzena)).toBe('qua., 19 de ago.')
  })
})
