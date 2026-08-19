import { describe, expect, it } from 'vitest'

import {
  extrairConfirmadosDaPlanilha,
  formatarListaParaCopiar,
  nomesSemPedido,
} from './comparacao-conferencia-helpers'
import type { LinhaBruta } from './importacao-helpers'

const DATA_ALVO = '2026-08-18'
// Meio-dia UTC cai sempre no mesmo dia de calendário em Brasília (UTC-3) —
// evita o fixture depender de horário perto da virada do dia.
const DATA_ALVO_CELULA = new Date('2026-08-18T12:00:00.000Z')
const OUTRA_DATA_CELULA = new Date('2026-07-09T12:00:00.000Z')

describe('extrairConfirmadosDaPlanilha', () => {
  it('lê blocos de almoço e janta na mesma aba, filtrando pela data da linha', () => {
    const linhas: LinhaBruta[] = [
      ['ALMOÇO- MARMITAS - 18/08/2026', null],
      [1, 'ADRIANA SOUZA', 'Enviar', DATA_ALVO_CELULA],
      [2, 'BRIAN CARVALHO', 'NÃO ENVIAR', null],
      [null, null],
      ['JANTA- MARMITAS', null],
      [1, 'ALINE RAMOS', 'Enviar', DATA_ALVO_CELULA],
      [2, 'LAISSE', 'NÃO ENVIAR', null],
    ]

    const resultado = extrairConfirmadosDaPlanilha({ Sheet1: linhas }, DATA_ALVO)

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
      [1, 'FULANO', 'Enviar', DATA_ALVO_CELULA],
    ]
    const janta: LinhaBruta[] = [
      ['JANTA- MARMITAS', null],
      [1, 'CICLANO', 'Enviar', DATA_ALVO_CELULA],
    ]

    const resultado = extrairConfirmadosDaPlanilha(
      { 'Aba almoço': almoco, 'Aba janta': janta },
      DATA_ALVO
    )

    expect(resultado.map((r) => r.nome)).toEqual(['FULANO', 'CICLANO'])
  })

  it('ignora linhas fora de um bloco de turno reconhecido', () => {
    const linhas: LinhaBruta[] = [
      ['SABÁDO 15/08/2026', null],
      [1, 'ALGUEM', 'Enviar', DATA_ALVO_CELULA],
    ]

    expect(extrairConfirmadosDaPlanilha({ Sheet1: linhas }, DATA_ALVO)).toEqual([])
  })

  it('não deixa uma aba de feriado/outro dia vazar pro dia sendo conferido', () => {
    // Regressão: o arquivo real da GPK tem abas de feriado com blocos
    // "ALMOÇO"/"JANTA" próprios, de outras datas — um cabeçalho de bloco
    // reconhecido não é garantia de que a linha é do dia certo.
    const abaDoDia: LinhaBruta[] = [
      ['ALMOÇO- MARMITAS - 18/08/2026', null],
      [1, 'ADRIANA SOUZA', 'Enviar', DATA_ALVO_CELULA],
    ]
    const abaDeFeriado: LinhaBruta[] = [
      ['09/07-FERIADO- NOVA PROGRAMAÇÃO', null],
      ['ALMOÇO- MARMITAS- (PRATO DO DIA)', null],
      [1, 'DOUGLAS', 'Enviar', OUTRA_DATA_CELULA],
    ]

    const resultado = extrairConfirmadosDaPlanilha(
      { Diaria: abaDoDia, 'Feriado 09.07': abaDeFeriado },
      DATA_ALVO
    )

    expect(resultado.map((r) => r.nome)).toEqual(['ADRIANA SOUZA'])
  })

  it('descarta linha confirmada sem data reconhecível (não arrisca falso positivo)', () => {
    const linhas: LinhaBruta[] = [
      ['ALMOÇO- MARMITAS', null],
      [1, 'SEM DATA', 'Enviar', null],
    ]

    expect(extrairConfirmadosDaPlanilha({ Sheet1: linhas }, DATA_ALVO)).toEqual([])
  })

  it('aceita a data da linha como serial numérico do Excel', () => {
    // 46252 = 18/08/2026 (dias desde 30/12/1899).
    const linhas: LinhaBruta[] = [
      ['ALMOÇO- MARMITAS', null],
      [1, 'FULANO', 'Enviar', 46252],
    ]

    expect(
      extrairConfirmadosDaPlanilha({ Sheet1: linhas }, DATA_ALVO).map((r) => r.nome)
    ).toEqual(['FULANO'])
  })

  it('dedupe linhas repetidas do mesmo nome/turno', () => {
    const linhas: LinhaBruta[] = [
      ['ALMOÇO- MARMITAS', null],
      [1, 'FULANO', 'Enviar', DATA_ALVO_CELULA],
      [2, 'Fulano', 'Enviar', DATA_ALVO_CELULA],
    ]

    expect(
      extrairConfirmadosDaPlanilha({ Sheet1: linhas }, DATA_ALVO)
    ).toHaveLength(1)
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
