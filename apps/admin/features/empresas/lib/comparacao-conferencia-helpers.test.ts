import { describe, expect, it } from 'vitest'

import {
  extrairConfirmadosDaPlanilha,
  formatarListaParaCopiar,
  nomesSemPedido,
} from './comparacao-conferencia-helpers'
import type { LinhaBruta } from './importacao-helpers'

describe('extrairConfirmadosDaPlanilha', () => {
  it('lê blocos de almoço e janta na mesma aba', () => {
    const linhas: LinhaBruta[] = [
      ['ALMOÇO- MARMITAS - 18/08/2026', null],
      [1, 'ADRIANA SOUZA', 'Enviar', 46252],
      [2, 'BRIAN CARVALHO', 'NÃO ENVIAR', null],
      [null, null],
      ['JANTA- MARMITAS', null],
      [1, 'ALINE RAMOS', 'Enviar', 46252],
      [2, 'LAISSE', 'NÃO ENVIAR', null],
    ]

    const resultado = extrairConfirmadosDaPlanilha({ Sheet1: linhas })

    expect(resultado).toEqual([
      { nome: 'ADRIANA SOUZA', turno: 'almoco', confirmado: true },
      { nome: 'BRIAN CARVALHO', turno: 'almoco', confirmado: false },
      { nome: 'ALINE RAMOS', turno: 'jantar', confirmado: true },
      { nome: 'LAISSE', turno: 'jantar', confirmado: false },
    ])
  })

  it('varre múltiplas abas do arquivo', () => {
    const almoco: LinhaBruta[] = [
      ['ALMOÇO- MARMITAS', null],
      [1, 'FULANO', 'Enviar', null],
    ]
    const janta: LinhaBruta[] = [
      ['JANTA- MARMITAS', null],
      [1, 'CICLANO', 'Enviar', null],
    ]

    const resultado = extrairConfirmadosDaPlanilha({
      'Aba almoço': almoco,
      'Aba janta': janta,
    })

    expect(resultado.map((r) => r.nome)).toEqual(['FULANO', 'CICLANO'])
  })

  it('ignora linhas fora de um bloco de turno reconhecido', () => {
    const linhas: LinhaBruta[] = [
      ['SABÁDO 15/08/2026', null],
      [1, 'ALGUEM', 'Enviar', null],
    ]

    expect(extrairConfirmadosDaPlanilha({ Sheet1: linhas })).toEqual([])
  })
})

describe('nomesSemPedido', () => {
  it('mantém só quem foi confirmado e não tem pedido no mesmo turno', () => {
    const confirmados = [
      { nome: 'Adriana Souza', turno: 'almoco' as const, confirmado: true },
      { nome: 'Brian Carvalho', turno: 'almoco' as const, confirmado: false },
      { nome: 'Aline Ramos', turno: 'jantar' as const, confirmado: true },
    ]
    const pedidos = [
      { nome: 'ALINE RAMOS', turno: 'jantar' as const, recusou: false },
    ]

    const faltantes = nomesSemPedido(confirmados, pedidos)

    expect(faltantes.map((f) => f.nome)).toEqual(['Adriana Souza'])
  })

  it('tolera pequenas diferenças de grafia entre a planilha e o cadastro', () => {
    const confirmados = [
      { nome: 'Jose Ailton', turno: 'almoco' as const, confirmado: true },
    ]
    const pedidos = [
      { nome: 'Joseilton', turno: 'almoco' as const, recusou: false },
    ]

    expect(nomesSemPedido(confirmados, pedidos)).toEqual([])
  })

  it('quem recusou o pedido não conta como "pediu"', () => {
    const confirmados = [
      { nome: 'Maria', turno: 'almoco' as const, confirmado: true },
    ]
    const pedidos = [
      { nome: 'Maria', turno: 'almoco' as const, recusou: true },
    ]

    expect(nomesSemPedido(confirmados, pedidos).map((f) => f.nome)).toEqual([
      'Maria',
    ])
  })

  it('não cruza turnos diferentes', () => {
    const confirmados = [
      { nome: 'Maria', turno: 'jantar' as const, confirmado: true },
    ]
    const pedidos = [
      { nome: 'Maria', turno: 'almoco' as const, recusou: false },
    ]

    expect(nomesSemPedido(confirmados, pedidos).map((f) => f.nome)).toEqual([
      'Maria',
    ])
  })
})

describe('formatarListaParaCopiar', () => {
  it('agrupa por turno, almoço antes de janta', () => {
    const texto = formatarListaParaCopiar([
      { nome: 'Bruno', turno: 'jantar', confirmado: true },
      { nome: 'Ana', turno: 'almoco', confirmado: true },
    ])

    expect(texto).toBe('Almoço (1):\n- Ana\n\nJanta (1):\n- Bruno')
  })

  it('devolve string vazia sem faltantes', () => {
    expect(formatarListaParaCopiar([])).toBe('')
  })
})
