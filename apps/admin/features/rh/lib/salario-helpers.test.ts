import { describe, expect, it } from 'vitest'

import {
  diasEntre,
  filtrarFuncionarios,
  ordenarVigencias,
  salarioVigenteEm,
  tempoDeCasa,
} from './salario-helpers'

const HISTORICO = [
  { valor: 1500, vigenteDesde: '2024-03-01' },
  { valor: 1800, vigenteDesde: '2025-06-01' },
  { valor: 2000, vigenteDesde: '2026-09-01' },
]

describe('salarioVigenteEm', () => {
  it('devolve null antes da primeira vigência', () => {
    expect(salarioVigenteEm(HISTORICO, '2024-02-28')).toBeNull()
  })

  it('devolve null quando não há histórico nenhum', () => {
    expect(salarioVigenteEm([], '2026-08-31')).toBeNull()
  })

  it('pega a vigência que já começou, não a futura', () => {
    expect(salarioVigenteEm(HISTORICO, '2026-08-31')?.valor).toBe(1800)
  })

  it('vale já no próprio dia da virada', () => {
    expect(salarioVigenteEm(HISTORICO, '2025-06-01')?.valor).toBe(1800)
  })

  it('um dia antes da virada ainda é o valor antigo', () => {
    expect(salarioVigenteEm(HISTORICO, '2025-05-31')?.valor).toBe(1500)
  })

  it('depois da última vigência, é a última', () => {
    expect(salarioVigenteEm(HISTORICO, '2030-01-01')?.valor).toBe(2000)
  })

  it('não depende da ordem da lista', () => {
    const embaralhado = [HISTORICO[2]!, HISTORICO[0]!, HISTORICO[1]!]
    expect(salarioVigenteEm(embaralhado, '2026-08-31')?.valor).toBe(1800)
  })

  it('é isso que impede o reajuste reescrever um mês fechado', () => {
    // Reajuste vigente 01/09; a folha de agosto pergunta pelo último dia dela.
    expect(salarioVigenteEm(HISTORICO, '2026-08-31')?.valor).toBe(1800)
    expect(salarioVigenteEm(HISTORICO, '2026-09-30')?.valor).toBe(2000)
  })
})

describe('ordenarVigencias', () => {
  it('põe a mais recente primeiro', () => {
    expect(ordenarVigencias(HISTORICO).map((v) => v.valor)).toEqual([
      2000, 1800, 1500,
    ])
  })

  it('não muda a lista original', () => {
    ordenarVigencias(HISTORICO)
    expect(HISTORICO[0]?.valor).toBe(1500)
  })
})

describe('diasEntre', () => {
  it('conta dias corridos sem escorregar por fuso', () => {
    expect(diasEntre('2026-08-01', '2026-08-31')).toBe(30)
  })

  it('atravessa a virada do ano', () => {
    expect(diasEntre('2026-12-20', '2027-01-04')).toBe(15)
  })

  it('respeita ano bissexto', () => {
    expect(diasEntre('2028-02-28', '2028-03-01')).toBe(2)
  })

  it('devolve zero no mesmo dia', () => {
    expect(diasEntre('2026-08-08', '2026-08-08')).toBe(0)
  })

  it('devolve negativo quando o fim é antes do início', () => {
    expect(diasEntre('2026-08-10', '2026-08-08')).toBe(-2)
  })
})

describe('tempoDeCasa', () => {
  const hoje = '2026-08-08'

  it('conta em dias no primeiro mês', () => {
    expect(tempoDeCasa('2026-08-01', hoje)).toBe('7 dias')
  })

  it('usa singular para um dia', () => {
    expect(tempoDeCasa('2026-08-07', hoje)).toBe('1 dia')
  })

  it('conta em meses no primeiro ano', () => {
    expect(tempoDeCasa('2026-02-08', hoje)).toBe('6 meses')
  })

  it('conta em anos e meses depois de um ano', () => {
    expect(tempoDeCasa('2023-06-08', hoje)).toBe('3 anos e 2 meses')
  })

  it('omite o resto quando fecha o ano redondo', () => {
    expect(tempoDeCasa('2025-08-08', hoje)).toBe('1 ano')
  })

  it('avisa quando a admissão é futura', () => {
    expect(tempoDeCasa('2026-09-01', hoje)).toBe('ainda não começou')
  })
})

describe('filtrarFuncionarios', () => {
  const equipe = [
    {
      nome: 'João Silva',
      cargoId: 'c1',
      turno: 'dia' as const,
      status: 'ativo' as const,
    },
    {
      nome: 'Maria Souza',
      cargoId: 'c2',
      turno: 'noite' as const,
      status: 'ativo' as const,
    },
    {
      nome: 'Zé Antigo',
      cargoId: 'c1',
      turno: 'ambos' as const,
      status: 'desligado' as const,
    },
  ]

  it('mostra só os ativos por padrão', () => {
    expect(filtrarFuncionarios(equipe, {})).toHaveLength(2)
  })

  it('mostra os desligados quando pedido', () => {
    expect(filtrarFuncionarios(equipe, { status: 'desligado' })).toHaveLength(1)
  })

  it('mostra todos quando o filtro é "todos"', () => {
    expect(filtrarFuncionarios(equipe, { status: 'todos' })).toHaveLength(3)
  })

  it('filtra por cargo', () => {
    expect(filtrarFuncionarios(equipe, { cargoId: 'c1' })).toHaveLength(1)
  })

  it('filtra por turno', () => {
    expect(filtrarFuncionarios(equipe, { turno: 'noite' })).toHaveLength(1)
  })

  it('busca por nome sem diferenciar caixa', () => {
    expect(filtrarFuncionarios(equipe, { busca: 'MARIA' })).toHaveLength(1)
  })

  it('combina filtros', () => {
    expect(
      filtrarFuncionarios(equipe, { cargoId: 'c1', status: 'todos' })
    ).toHaveLength(2)
  })
})
