import { describe, expect, it } from 'vitest'

import { proximoSlugDisponivel, slugify } from './urls'

describe('slugify', () => {
  it('remove acento e espaço, deixa minúsculo com hífen', () => {
    expect(slugify('LNR Componentes Ltda')).toBe('lnr-componentes-ltda')
    expect(slugify('GPK Componentes')).toBe('gpk-componentes')
  })

  it('colapsa pontuação em um único hífen', () => {
    expect(slugify('Restaurante & Cia. (Matriz)')).toBe('restaurante-cia-matriz')
  })

  it('remove hífen nas pontas', () => {
    expect(slugify('  -Empresa Teste- ')).toBe('empresa-teste')
  })
})

describe('proximoSlugDisponivel', () => {
  it('usa a base pura quando ela está livre', () => {
    expect(proximoSlugDisponivel('gpk', ['lnr', 'cofel'])).toBe('gpk')
  })

  it('incrementa sufixo numérico quando a base já existe', () => {
    expect(proximoSlugDisponivel('gpk', ['gpk'])).toBe('gpk-2')
    expect(proximoSlugDisponivel('gpk', ['gpk', 'gpk-2'])).toBe('gpk-3')
  })
})
