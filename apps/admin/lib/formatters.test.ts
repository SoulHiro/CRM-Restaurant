import { describe, expect, it } from 'vitest'

import {
  formatCurrencyBRL,
  formatDateBR,
  formatDateTimeBR,
  formatShortDateBR,
} from './formatters'

/**
 * `Intl.NumberFormat` separa "R$" do número com espaço não-quebrável (U+00A0),
 * não com espaço comum — normalizar deixa a comparação legível no teste.
 */
function comEspacoComum(valor: string): string {
  return valor.replace(/ /g, ' ')
}

describe('formatCurrencyBRL', () => {
  it('formata em real com separador brasileiro', () => {
    expect(comEspacoComum(formatCurrencyBRL(1234.5))).toBe('R$ 1.234,50')
    expect(comEspacoComum(formatCurrencyBRL(0))).toBe('R$ 0,00')
  })

  it('formata valor negativo', () => {
    expect(comEspacoComum(formatCurrencyBRL(-9100))).toBe('-R$ 9.100,00')
  })
})

describe('formatDateBR', () => {
  // Este é o bug que já apareceu em produção: 'YYYY-MM-DD' vira meia-noite UTC
  // e, formatado em Brasília (−3h), volta um dia.
  it('mostra o dia guardado, sem voltar um por causa de fuso', () => {
    expect(formatDateBR('2026-11-08')).toBe('08/11/2026')
    expect(formatDateBR('2026-01-01')).toBe('01/01/2026')
    expect(formatDateBR('2026-03-01')).toBe('01/03/2026')
  })

  it('preserva o dia na virada de ano', () => {
    expect(formatDateBR('2025-12-31')).toBe('31/12/2025')
  })

  it('preserva 29 de fevereiro em ano bissexto', () => {
    expect(formatDateBR('2028-02-29')).toBe('29/02/2028')
  })

  it('converte timestamp real para o horário do restaurante', () => {
    // 01:00 UTC ainda é o dia anterior às 22:00 em Brasília.
    expect(formatDateBR('2026-08-08T01:00:00.000Z')).toBe('07/08/2026')
    expect(formatDateBR('2026-08-08T12:00:00.000Z')).toBe('08/08/2026')
  })

  it('aceita Date direto', () => {
    expect(formatDateBR(new Date('2026-08-08T12:00:00.000Z'))).toBe('08/08/2026')
  })
})

describe('formatShortDateBR', () => {
  it('mostra dia/mês sem deslocar por fuso', () => {
    expect(formatShortDateBR('2026-11-08')).toBe('08/11')
    expect(formatShortDateBR('2026-01-01')).toBe('01/01')
  })

  it('converte timestamp real para o horário do restaurante', () => {
    expect(formatShortDateBR('2026-08-08T01:00:00.000Z')).toBe('07/08')
  })
})

describe('formatDateTimeBR', () => {
  it('mostra data e hora no fuso do restaurante', () => {
    expect(formatDateTimeBR('2026-08-10T14:32:00.000Z')).toBe('10/08/2026 11:32')
  })
})
