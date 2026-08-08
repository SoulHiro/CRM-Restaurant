import { describe, expect, it } from 'vitest'

import {
  filtrarFornecedores,
  mediaAvaliacao,
  melhorOferta,
} from './fornecedor-helpers'

describe('mediaAvaliacao', () => {
  it('devolve null quando o fornecedor nunca foi avaliado', () => {
    expect(mediaAvaliacao([])).toBeNull()
  })

  it('devolve a própria nota quando só há uma avaliação', () => {
    expect(mediaAvaliacao([{ nota: 4 }])).toBe(4)
  })

  it('tira a média de várias', () => {
    expect(mediaAvaliacao([{ nota: 5 }, { nota: 3 }])).toBe(4)
  })

  it('arredonda para uma casa decimal', () => {
    expect(mediaAvaliacao([{ nota: 5 }, { nota: 4 }, { nota: 4 }])).toBe(4.3)
  })
})

describe('melhorOferta', () => {
  const atacadao = {
    fornecedorId: 'f1',
    fornecedorNome: 'Atacadão Central',
    preco: 9,
    prazoEntregaDias: 3,
  }
  const hortifruti = {
    fornecedorId: 'f2',
    fornecedorNome: 'Hortifruti do Zé',
    preco: 8.5,
    prazoEntregaDias: 5,
  }

  it('devolve null sem ofertas', () => {
    expect(melhorOferta([])).toBeNull()
  })

  it('escolhe o preço mais baixo', () => {
    expect(melhorOferta([atacadao, hortifruti])?.fornecedorId).toBe('f2')
  })

  it('não depende da ordem da lista', () => {
    expect(melhorOferta([hortifruti, atacadao])?.fornecedorId).toBe('f2')
  })

  it('desempata preço igual pelo prazo mais curto', () => {
    const rapido = { ...hortifruti, preco: 9, prazoEntregaDias: 1 }
    expect(melhorOferta([atacadao, rapido])?.fornecedorId).toBe('f2')
  })

  it('prefere prazo conhecido a prazo em branco no empate', () => {
    const semPrazo = { ...hortifruti, preco: 9, prazoEntregaDias: null }
    expect(melhorOferta([semPrazo, atacadao])?.fornecedorId).toBe('f1')
  })
})

describe('filtrarFornecedores', () => {
  const fornecedores = [
    { nome: 'Atacadão Central', contato: '11 99999-0000' },
    { nome: 'Hortifruti do Zé', contato: null },
  ]

  it('devolve todos com busca vazia', () => {
    expect(filtrarFornecedores(fornecedores, '  ')).toHaveLength(2)
  })

  it('busca por nome sem diferenciar caixa', () => {
    expect(filtrarFornecedores(fornecedores, 'ATACADÃO')).toHaveLength(1)
  })

  it('busca pelo contato', () => {
    expect(filtrarFornecedores(fornecedores, '99999')[0]?.nome).toBe(
      'Atacadão Central'
    )
  })

  it('não quebra em fornecedor sem contato', () => {
    expect(filtrarFornecedores(fornecedores, 'zé')).toHaveLength(1)
  })
})
