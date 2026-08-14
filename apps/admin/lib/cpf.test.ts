import { describe, expect, it } from 'vitest'

import {
  cpfValido,
  digitosDoCpf,
  finalDoCpf,
  formatarCpf,
  mascararCpf,
} from './cpf'

const CPF = '52998224725'

describe('digitosDoCpf / finalDoCpf / mascararCpf / formatarCpf', () => {
  it('tira a máscara digitada', () => {
    expect(digitosDoCpf('529.982.247-25')).toBe(CPF)
  })

  it('guarda só os 5 últimos dígitos', () => {
    expect(finalDoCpf('529.982.247-25')).toBe('24725')
  })

  it('monta a máscara de exibição', () => {
    expect(mascararCpf('24725')).toBe('•••.•••.247-25')
  })

  it('mostra travessão quando não há final guardado', () => {
    expect(mascararCpf(null)).toBe('—')
    expect(mascararCpf('12')).toBe('—')
  })

  it('formata o CPF completo', () => {
    expect(formatarCpf(CPF)).toBe('529.982.247-25')
  })

  it('devolve o texto original quando não são 11 dígitos', () => {
    expect(formatarCpf('123')).toBe('123')
  })
})

describe('cpfValido', () => {
  it('aceita CPF com dígitos verificadores corretos', () => {
    expect(cpfValido(CPF)).toBe(true)
    expect(cpfValido('529.982.247-25')).toBe(true)
  })

  it('recusa dígito verificador errado', () => {
    expect(cpfValido('52998224726')).toBe(false)
  })

  it('recusa tamanho errado', () => {
    expect(cpfValido('5299822472')).toBe(false)
    expect(cpfValido('')).toBe(false)
  })

  it('recusa os repetidos, que passam na conta mas não existem', () => {
    expect(cpfValido('11111111111')).toBe(false)
    expect(cpfValido('00000000000')).toBe(false)
  })
})
