import { describe, expect, it } from 'vitest'

import {
  agruparAusenciasPorTipo,
  diasDeAusencia,
  primeiroDiaDoMes,
  segundaDaSemana,
  semanasPagasNaCompetencia,
  somarDiasISO,
  ultimoDiaDoMes,
  vencimentoDaSemana,
} from './ausencia-helpers'

const SEGUNDA = 1
const QUARTA = 3
const SABADO = 6

describe('diasDeAusencia', () => {
  it('conta as duas pontas — um dia só é 1, não 0', () => {
    expect(diasDeAusencia('2026-08-08', '2026-08-08')).toBe(1)
  })

  it('conta um período normal', () => {
    expect(diasDeAusencia('2026-08-01', '2026-08-03')).toBe(3)
  })

  it('não devolve negativo com datas invertidas', () => {
    expect(diasDeAusencia('2026-08-10', '2026-08-01')).toBe(0)
  })
})

describe('primeiroDiaDoMes / ultimoDiaDoMes', () => {
  it('resolve mês de 31 e de 30 dias', () => {
    expect(ultimoDiaDoMes('2026-08')).toBe('2026-08-31')
    expect(ultimoDiaDoMes('2026-09')).toBe('2026-09-30')
  })

  it('resolve fevereiro comum e bissexto', () => {
    expect(ultimoDiaDoMes('2026-02')).toBe('2026-02-28')
    expect(ultimoDiaDoMes('2028-02')).toBe('2028-02-29')
  })

  it('dá o primeiro dia', () => {
    expect(primeiroDiaDoMes('2026-08')).toBe('2026-08-01')
  })
})

describe('somarDiasISO', () => {
  it('soma sem escorregar de dia por fuso', () => {
    expect(somarDiasISO('2026-08-31', 1)).toBe('2026-09-01')
  })

  it('subtrai atravessando a virada do mês', () => {
    expect(somarDiasISO('2026-08-01', -14)).toBe('2026-07-18')
  })

  it('respeita ano bissexto', () => {
    expect(somarDiasISO('2028-02-28', 1)).toBe('2028-02-29')
  })
})

describe('segundaDaSemana', () => {
  it('devolve a própria data quando já é segunda', () => {
    expect(segundaDaSemana('2026-08-03')).toBe('2026-08-03')
  })

  it('recua do sábado para a segunda daquela semana', () => {
    expect(segundaDaSemana('2026-08-01')).toBe('2026-07-27')
  })

  it('domingo pertence à semana que começou na segunda anterior', () => {
    expect(segundaDaSemana('2026-08-09')).toBe('2026-08-03')
  })
})

describe('vencimentoDaSemana', () => {
  it('vence no próprio dia quando a semana fecha no dia do pagamento', () => {
    expect(vencimentoDaSemana('2026-08-08', SABADO)).toBe('2026-08-08')
  })

  it('vence na quarta seguinte quando o pagamento é na quarta', () => {
    expect(vencimentoDaSemana('2026-08-08', QUARTA)).toBe('2026-08-12')
  })

  it('atravessa a virada do mês', () => {
    expect(vencimentoDaSemana('2026-08-29', QUARTA)).toBe('2026-09-02')
  })
})

describe('semanasPagasNaCompetencia', () => {
  const base = {
    ausencias: [],
    folgaSemanal: null,
    competencia: '2026-08',
    diaPagamento: SABADO,
  }

  it('traz as semanas inteiras pagas no mês, sem fragmento de 1 dia', () => {
    const semanas = semanasPagasNaCompetencia(base)

    expect(semanas).toEqual([
      { inicio: '2026-07-27', fim: '2026-08-01', diarias: 6, vencimento: '2026-08-01' },
      { inicio: '2026-08-03', fim: '2026-08-08', diarias: 6, vencimento: '2026-08-08' },
      { inicio: '2026-08-10', fim: '2026-08-15', diarias: 6, vencimento: '2026-08-15' },
      { inicio: '2026-08-17', fim: '2026-08-22', diarias: 6, vencimento: '2026-08-22' },
      { inicio: '2026-08-24', fim: '2026-08-29', diarias: 6, vencimento: '2026-08-29' },
    ])
  })

  it('a semana da virada aparece uma vez só, na folha em que é paga', () => {
    // 27/07 a 01/08 é paga em 01/08 → agosto. Não pode aparecer em julho.
    const agosto = semanasPagasNaCompetencia(base).map((s) => s.inicio)
    const julho = semanasPagasNaCompetencia({
      ...base,
      competencia: '2026-07',
    }).map((s) => s.inicio)

    expect(agosto).toContain('2026-07-27')
    expect(julho).not.toContain('2026-07-27')
  })

  it('a semana de 31/08 cai em setembro, que é quando é paga', () => {
    const setembro = semanasPagasNaCompetencia({
      ...base,
      competencia: '2026-09',
    })
    expect(setembro[0]).toEqual({
      inicio: '2026-08-31',
      fim: '2026-09-05',
      diarias: 6,
      vencimento: '2026-09-05',
    })
  })

  it('domingo nunca entra: a semana é de segunda a sábado', () => {
    const semanas = semanasPagasNaCompetencia(base)
    expect(semanas.every((s) => s.diarias <= 6)).toBe(true)
  })

  it('tira a folga fixa da semana', () => {
    const semanas = semanasPagasNaCompetencia({
      ...base,
      folgaSemanal: SEGUNDA,
    })
    expect(semanas.every((s) => s.diarias === 5)).toBe(true)
    expect(semanas.reduce((soma, s) => soma + s.diarias, 0)).toBe(25)
  })

  it('tira também a ausência avulsa do rodízio de sábado', () => {
    const semanas = semanasPagasNaCompetencia({
      ...base,
      folgaSemanal: SEGUNDA,
      ausencias: [{ dataInicio: '2026-08-15', dataFim: '2026-08-15' }],
    })
    expect(semanas.reduce((soma, s) => soma + s.diarias, 0)).toBe(24)
  })

  it('não desconta duas vezes quando a ausência cai na folga fixa', () => {
    const semanas = semanasPagasNaCompetencia({
      ...base,
      folgaSemanal: SEGUNDA,
      ausencias: [{ dataInicio: '2026-08-10', dataFim: '2026-08-10' }],
    })
    expect(semanas.reduce((soma, s) => soma + s.diarias, 0)).toBe(25)
  })

  it('some com a semana que virou inteira em ausência', () => {
    const semanas = semanasPagasNaCompetencia({
      ...base,
      ausencias: [{ dataInicio: '2026-08-03', dataFim: '2026-08-08' }],
    })
    expect(semanas.map((s) => s.inicio)).not.toContain('2026-08-03')
    expect(semanas).toHaveLength(4)
  })

  it('não paga dias anteriores à admissão', () => {
    const semanas = semanasPagasNaCompetencia({
      ...base,
      desde: '2026-08-05',
    })
    // A semana 03–08/08 fica com quarta a sábado; a de 27/07 some.
    expect(semanas[0]).toEqual({
      inicio: '2026-08-03',
      fim: '2026-08-08',
      diarias: 4,
      vencimento: '2026-08-08',
    })
  })

  it('não paga dias depois do desligamento', () => {
    const semanas = semanasPagasNaCompetencia({
      ...base,
      ate: '2026-08-12',
    })
    expect(semanas).toHaveLength(3)
    expect(semanas[2]?.diarias).toBe(3)
  })

  it('muda o conjunto de semanas quando o dia de pagamento muda', () => {
    const naQuarta = semanasPagasNaCompetencia({
      ...base,
      diaPagamento: QUARTA,
    })
    expect(naQuarta.map((s) => s.vencimento)).toEqual([
      '2026-08-05',
      '2026-08-12',
      '2026-08-19',
      '2026-08-26',
    ])
  })
})

describe('agruparAusenciasPorTipo', () => {
  it('conta por tipo, do mais frequente para o menos', () => {
    const grupos = agruparAusenciasPorTipo([
      { tipo: 'folga' as const },
      { tipo: 'atestado_medico' as const },
      { tipo: 'folga' as const },
    ])

    expect(grupos).toEqual([
      { tipo: 'folga', quantidade: 2 },
      { tipo: 'atestado_medico', quantidade: 1 },
    ])
  })

  it('devolve vazio sem ausências', () => {
    expect(agruparAusenciasPorTipo([])).toEqual([])
  })
})
