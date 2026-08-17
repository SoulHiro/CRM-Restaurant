import { describe, expect, it } from 'vitest'

import { somarDiasISO } from './dates'

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

  it('devolve o mesmo dia quando soma zero', () => {
    expect(somarDiasISO('2026-08-07', 0)).toBe('2026-08-07')
  })
})
