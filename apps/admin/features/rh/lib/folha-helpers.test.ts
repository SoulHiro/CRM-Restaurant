import { describe, expect, it } from 'vitest'

import {
  competenciaAnterior,
  competenciaDe,
  montarPreviaFolha,
  rotuloCompetencia,
  subtipoDespesa,
  totalFolha,
  vencimentoPadrao,
} from './folha-helpers'

type Funcionario = Parameters<typeof montarPreviaFolha>[0][number]

function funcionario(over: Partial<Funcionario> = {}): Funcionario {
  return {
    id: 'f1',
    nome: 'João Silva',
    cargoNome: 'Cozinheiro',
    dataAdmissao: '2024-01-01',
    dataDesligamento: null,
    salarios: [{ valor: 1800, vigenteDesde: '2024-01-01' }],
    beneficios: [],
    ausencias: [],
    entregador: null,
    ...over,
  }
}

describe('rotuloCompetencia / competenciaDe / competenciaAnterior', () => {
  it('escreve o mês por extenso em pt-BR', () => {
    expect(rotuloCompetencia('2026-08')).toBe('agosto de 2026')
    expect(rotuloCompetencia('2026-03')).toBe('março de 2026')
  })

  it('devolve o próprio texto se a competência for inválida', () => {
    expect(rotuloCompetencia('xxxx')).toBe('xxxx')
    expect(rotuloCompetencia('2026-13')).toBe('2026-13')
  })

  it('extrai a competência de uma data', () => {
    expect(competenciaDe('2026-08-08')).toBe('2026-08')
  })

  it('volta um mês, inclusive na virada do ano', () => {
    expect(competenciaAnterior('2026-08')).toBe('2026-07')
    expect(competenciaAnterior('2026-01')).toBe('2025-12')
  })
})

describe('vencimentoPadrao', () => {
  it('vence dia 5 do mês seguinte ao trabalhado', () => {
    expect(vencimentoPadrao('2026-08')).toBe('2026-09-05')
  })

  it('atravessa a virada do ano', () => {
    expect(vencimentoPadrao('2026-12')).toBe('2027-01-05')
  })
})

describe('montarPreviaFolha', () => {
  it('usa o salário vigente NA competência, não o de hoje', () => {
    const linhas = montarPreviaFolha(
      [
        funcionario({
          salarios: [
            { valor: 1800, vigenteDesde: '2024-01-01' },
            { valor: 2000, vigenteDesde: '2026-09-01' },
          ],
        }),
      ],
      '2026-08'
    )

    expect(linhas[0]?.valor).toBe(1800)
  })

  it('já usa o valor novo na competência seguinte', () => {
    const linhas = montarPreviaFolha(
      [
        funcionario({
          salarios: [
            { valor: 1800, vigenteDesde: '2024-01-01' },
            { valor: 2000, vigenteDesde: '2026-09-01' },
          ],
        }),
      ],
      '2026-09'
    )

    expect(linhas[0]?.valor).toBe(2000)
  })

  it('não inclui quem foi admitido depois do mês acabar', () => {
    expect(
      montarPreviaFolha(
        [funcionario({ dataAdmissao: '2026-09-15' })],
        '2026-08'
      )
    ).toHaveLength(0)
  })

  it('inclui quem foi desligado no meio do mês', () => {
    const linhas = montarPreviaFolha(
      [funcionario({ dataDesligamento: '2026-08-15' })],
      '2026-08'
    )

    expect(linhas).toHaveLength(1)
  })

  it('não inclui quem saiu antes do mês começar', () => {
    expect(
      montarPreviaFolha(
        [funcionario({ dataDesligamento: '2026-07-20' })],
        '2026-08'
      )
    ).toHaveLength(0)
  })

  it('não gera linha de salário para quem não tem vigência ainda', () => {
    expect(
      montarPreviaFolha(
        [funcionario({ salarios: [{ valor: 1800, vigenteDesde: '2027-01-01' }] })],
        '2026-08'
      )
    ).toHaveLength(0)
  })

  it('inclui benefício recorrente e ativo', () => {
    const linhas = montarPreviaFolha(
      [
        funcionario({
          beneficios: [
            {
              tipo: 'vale_transporte',
              valor: 220,
              recorrente: true,
              ativo: true,
            },
          ],
        }),
      ],
      '2026-08'
    )

    expect(linhas).toHaveLength(2)
    expect(linhas.find((l) => l.tipo === 'beneficio')?.valor).toBe(220)
  })

  it('deixa de fora benefício inativo ou não recorrente', () => {
    const linhas = montarPreviaFolha(
      [
        funcionario({
          beneficios: [
            { tipo: 'vale_transporte', valor: 220, recorrente: true, ativo: false },
            { tipo: 'bonus', valor: 500, recorrente: false, ativo: true },
          ],
        }),
      ],
      '2026-08'
    )

    expect(linhas).toHaveLength(1)
  })

  // Agosto/2026: 5 semanas PAGAS no mês (segunda a sábado, agrupadas pela
  // data de pagamento) — a de 27/07 a 01/08 entra inteira porque é paga em
  // 01/08; a de 31/08 a 05/09 cai em setembro, que é quando é paga.
  function entregador(over: Partial<Funcionario> = {}): Funcionario {
    return funcionario({
      nome: 'Igor',
      cargoNome: 'Entregador',
      salarios: [],
      entregador: { valorDiaria: 100, folgaSemanal: null },
      ...over,
    })
  }

  it('paga entregador por semana, uma linha para cada, sem fragmento de 1 dia', () => {
    const linhas = montarPreviaFolha([entregador()], '2026-08')

    expect(linhas).toHaveLength(5)
    expect(linhas.every((l) => l.tipo === 'diaria')).toBe(true)
    expect(linhas.every((l) => l.quantidade === 6)).toBe(true)
    expect(totalFolha(linhas)).toBe(3000)
  })

  it('a primeira semana é a que fecha no sábado 01/08, mesmo com dias de julho', () => {
    const linhas = montarPreviaFolha([entregador()], '2026-08')
    expect(linhas[0]?.descricao).toBe('27/07 a 01/08 · 6 diárias')
  })

  it('tira a folga fixa da semana: Igor folga toda segunda', () => {
    const linhas = montarPreviaFolha(
      [entregador({ entregador: { valorDiaria: 100, folgaSemanal: 1 } })],
      '2026-08'
    )

    expect(linhas).toHaveLength(5)
    expect(linhas.every((l) => l.quantidade === 5)).toBe(true)
    expect(totalFolha(linhas)).toBe(2500)
  })

  it('soma a folga fixa ao sábado do rodízio', () => {
    const linhas = montarPreviaFolha(
      [
        entregador({
          entregador: { valorDiaria: 100, folgaSemanal: 1 },
          ausencias: [{ dataInicio: '2026-08-15', dataFim: '2026-08-15' }],
        }),
      ],
      '2026-08'
    )

    expect(linhas.reduce((soma, l) => soma + (l.quantidade ?? 0), 0)).toBe(24)
    expect(totalFolha(linhas)).toBe(2400)
  })

  it('não desconta duas vezes quando a ausência cai na folga fixa', () => {
    const linhas = montarPreviaFolha(
      [
        entregador({
          entregador: { valorDiaria: 100, folgaSemanal: 1 },
          ausencias: [{ dataInicio: '2026-08-10', dataFim: '2026-08-10' }],
        }),
      ],
      '2026-08'
    )

    expect(linhas.reduce((soma, l) => soma + (l.quantidade ?? 0), 0)).toBe(25)
  })

  it('vence no próprio sábado quando o pagamento é no sábado', () => {
    const linhas = montarPreviaFolha([entregador()], '2026-08', 6)
    expect(linhas.map((l) => l.dataVencimento)).toEqual([
      '2026-08-01',
      '2026-08-08',
      '2026-08-15',
      '2026-08-22',
      '2026-08-29',
    ])
  })

  it('vence na quarta seguinte quando o pagamento é na quarta — a semana que venceria em setembro sai desta folha', () => {
    const linhas = montarPreviaFolha([entregador()], '2026-08', 3)
    expect(linhas.map((l) => l.dataVencimento)).toEqual([
      '2026-08-05',
      '2026-08-12',
      '2026-08-19',
      '2026-08-26',
    ])
  })

  it('mensalista continua numa linha só, vencendo dia 5', () => {
    const linhas = montarPreviaFolha([funcionario()], '2026-08')
    expect(linhas).toHaveLength(1)
    expect(linhas[0]?.dataVencimento).toBe('2026-09-05')
  })

  it('ordena por nome do funcionário', () => {
    const linhas = montarPreviaFolha(
      [
        funcionario({ id: 'b', nome: 'Zeca' }),
        funcionario({ id: 'a', nome: 'Ana' }),
      ],
      '2026-08'
    )

    expect(linhas.map((l) => l.funcionarioNome)).toEqual(['Ana', 'Zeca'])
  })

  it('devolve vazio sem funcionários', () => {
    expect(montarPreviaFolha([], '2026-08')).toEqual([])
  })
})

describe('totalFolha', () => {
  it('soma as linhas', () => {
    expect(totalFolha([{ valor: 1800 }, { valor: 220 }, { valor: 2800 }])).toBe(
      4820
    )
  })

  it('não deixa resíduo de float', () => {
    expect(totalFolha([{ valor: 1800.1 }, { valor: 220.2 }])).toBe(2020.3)
  })

  it('devolve zero na folha vazia', () => {
    expect(totalFolha([])).toBe(0)
  })
})

describe('subtipoDespesa', () => {
  it('salário e diária caem em salário', () => {
    expect(subtipoDespesa('salario', 'Salário')).toBe('salario')
    expect(subtipoDespesa('diaria', '18 diárias')).toBe('salario')
  })

  it('vale transporte tem subtipo próprio no DRE', () => {
    expect(subtipoDespesa('beneficio', 'Vale transporte')).toBe(
      'vale_transporte'
    )
  })

  it('outros benefícios caem em outro', () => {
    expect(subtipoDespesa('beneficio', 'Bônus')).toBe('outro')
  })
})
