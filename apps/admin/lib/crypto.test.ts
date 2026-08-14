import { randomBytes } from 'node:crypto'
import { beforeAll, describe, expect, it } from 'vitest'

import { cifrar, decifrar } from './crypto'

const CPF = '52998224725'

beforeAll(() => {
  process.env.CPF_ENCRYPTION_KEY = randomBytes(32).toString('base64')
})

describe('cifrar / decifrar', () => {
  it('devolve o original na ida e volta', () => {
    expect(decifrar(cifrar(CPF))).toBe(CPF)
  })

  it('não deixa os dígitos aparecerem no valor cifrado', () => {
    expect(cifrar(CPF)).not.toContain(CPF)
  })

  it('gera blobs diferentes para o mesmo valor', () => {
    expect(cifrar(CPF)).not.toBe(cifrar(CPF))
  })

  it('recusa um blob adulterado em vez de devolver lixo', () => {
    const blob = cifrar(CPF)
    const [iv, tag, dados] = blob.split('.') as [string, string, string]
    const trocado = dados[0] === 'A' ? 'B' : 'A'
    const adulterado = [iv, tag, trocado + dados.slice(1)].join('.')

    expect(() => decifrar(adulterado)).toThrow()
  })

  it('recusa blob em formato inválido', () => {
    expect(() => decifrar('nao-e-um-blob')).toThrow(
      'Valor cifrado em formato inválido'
    )
  })

  it('recusa chave de tamanho errado', () => {
    const original = process.env.CPF_ENCRYPTION_KEY
    process.env.CPF_ENCRYPTION_KEY = Buffer.from('curta').toString('base64')
    expect(() => cifrar(CPF)).toThrow('32 bytes')
    process.env.CPF_ENCRYPTION_KEY = original
  })

  it('exige a chave estar definida', () => {
    const original = process.env.CPF_ENCRYPTION_KEY
    delete process.env.CPF_ENCRYPTION_KEY
    expect(() => cifrar(CPF)).toThrow('não está definida')
    process.env.CPF_ENCRYPTION_KEY = original
  })

  it('cifra string vazia sem quebrar', () => {
    expect(decifrar(cifrar(''))).toBe('')
  })
})
