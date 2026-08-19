import { describe, expect, it } from 'vitest'

import {
  deduparPorCarimbo,
  detectarColunas,
  ehRecusa,
  linhasParaDias,
  parseSemanaCardapio,
  sugerirCorrespondencia,
  type LinhaBruta,
  type PedidoDiaBruto,
} from './importacao-helpers'

describe('parseSemanaCardapio', () => {
  it('lê a semana com separador minúsculo', () => {
    expect(parseSemanaCardapio('10/08/2026 a 14/08/2026')).toEqual({
      inicio: '2026-08-10',
    })
  })

  it('tolera o separador em Á maiúsculo', () => {
    expect(parseSemanaCardapio('04/08/2025 Á 08/08/2025')).toEqual({
      inicio: '2025-08-04',
    })
  })

  it('tolera o separador em á minúsculo com acento', () => {
    expect(parseSemanaCardapio('14/07/2025 á 18/07/2025')).toEqual({
      inicio: '2025-07-14',
    })
  })

  it('devolve null para texto fora do formato esperado', () => {
    expect(parseSemanaCardapio('semana que vem')).toBeNull()
    expect(parseSemanaCardapio('')).toBeNull()
  })
})

describe('detectarColunas', () => {
  const cabecalho: LinhaBruta = [
    'Carimbo de data/hora',
    'Semana do Cardápio',
    'Nome do Colaborador',
    'Horário',
    'Tamanho da Embalagem',
    'Segunda-Feira 17/08/2026',
    'Observações_Segunda-Feira',
    'Terça-Feira 18/08/2026',
    'Observações_Terça-Feira',
    'Quarta-Feira 19/08/2026',
    'Observações_Quarta-Feira',
    'Quinta-Feira 20/08/2026',
    'Observações_Quinta-Feira',
    'Sexta-Feira 21/08/2026',
    'Observações_Sexta-Feira',
    'Número de Telefone (Whatsapp)',
  ]

  it('mapeia todas as colunas fixas', () => {
    const mapeamento = detectarColunas(cabecalho)
    expect(mapeamento.colCarimbo).toBe(0)
    expect(mapeamento.colSemana).toBe(1)
    expect(mapeamento.colNome).toBe(2)
    expect(mapeamento.colTurno).toBe(3)
    expect(mapeamento.colTamanho).toBe(4)
    expect(mapeamento.colWhatsapp).toBe(15)
  })

  it('mapeia prato e observação de cada dia útil, sem misturar', () => {
    const mapeamento = detectarColunas(cabecalho)
    const segunda = mapeamento.dias.find((d) => d.dia === 'segunda')
    expect(segunda).toEqual({ dia: 'segunda', colPrato: 5, colObs: 6 })

    const sexta = mapeamento.dias.find((d) => d.dia === 'sexta')
    expect(sexta).toEqual({ dia: 'sexta', colPrato: 13, colObs: 14 })
  })
})

describe('linhasParaDias', () => {
  const mapeamento = detectarColunas([
    'Carimbo de data/hora',
    'Semana do Cardápio',
    'Nome do Colaborador',
    'Horário',
    'Tamanho da Embalagem',
    'Segunda-Feira',
    'Observações_Segunda-Feira',
    'Terça-Feira',
    'Observações_Terça-Feira',
    'Quarta-Feira',
    'Observações_Quarta-Feira',
    'Quinta-Feira',
    'Observações_Quinta-Feira',
    'Sexta-Feira',
    'Observações_Sexta-Feira',
    'Whatsapp',
  ])

  it('expande uma linha em um pedido por dia preenchido', () => {
    const linha: LinhaBruta = [
      new Date('2026-08-10T14:32:00Z'),
      '10/08/2026 a 14/08/2026',
      'João da Silva',
      'ALMOÇO',
      '(M)_Média',
      'Frango grelhado',
      '',
      'Feijoada',
      'Sem cebola',
      '',
      '',
      'Peixe assado',
      '',
      'Macarronada',
      '',
      '11999999999',
    ]

    const resultado = linhasParaDias([linha], mapeamento)

    expect(resultado).toHaveLength(4)
    expect(resultado[0]).toMatchObject({
      nome: 'João da Silva',
      data: '2026-08-10',
      turno: 'almoco',
      tamanho: 'M',
      prato: 'Frango grelhado',
      observacao: null,
    })
    expect(resultado[0]?.carimbo?.toISOString()).toBe('2026-08-10T14:32:00.000Z')
    expect(resultado[1]).toMatchObject({
      data: '2026-08-11',
      prato: 'Feijoada',
      observacao: 'Sem cebola',
    })
    expect(resultado[2]).toMatchObject({ data: '2026-08-13', prato: 'Peixe assado' })
    expect(resultado[3]).toMatchObject({ data: '2026-08-14', prato: 'Macarronada' })
  })

  it('ignora linha sem semana reconhecível', () => {
    const linha: LinhaBruta = [
      45000,
      'não sei',
      'Maria',
      'JANTAR',
      '(P)_Pequena',
      'Frango',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
    ]
    expect(linhasParaDias([linha], mapeamento)).toEqual([])
  })

  it('ignora linha sem nome', () => {
    const linha: LinhaBruta = [
      45000,
      '10/08/2026 a 14/08/2026',
      '',
      'JANTAR',
      '(P)_Pequena',
      'Frango',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
    ]
    expect(linhasParaDias([linha], mapeamento)).toEqual([])
  })

  // Vocabulário de turno da NOVAPRINT2 (empresa.fluxo_pedido = 'pesagem') —
  // 1°/2°/3° turno vêm com º ou ° (não são marca diacrítica, `normalizar`
  // não remove) e às vezes sem nenhum símbolo.
  it.each([
    ['1° TURNO', '1_turno'],
    ['2° TURNO', '2_turno'],
    ['3º TURNO', '3_turno'],
    ['1 TURNO', '1_turno'],
    ['ADMINISTRATIVO', 'administrativo'],
  ])('reconhece o turno "%s" como %s', (textoTurno, turnoEsperado) => {
    const linha: LinhaBruta = [
      45000,
      '10/08/2026 a 14/08/2026',
      'Fulano',
      textoTurno,
      '',
      'Frango',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
    ]
    expect(linhasParaDias([linha], mapeamento)[0]).toMatchObject({
      turno: turnoEsperado,
    })
  })

  it.each(['FÉRIAS', 'AFASTADO'])(
    'ignora a linha inteira quando o turno é "%s"',
    (textoTurno) => {
      const linha: LinhaBruta = [
        45000,
        '10/08/2026 a 14/08/2026',
        'Fulano',
        textoTurno,
        '',
        'Frango',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
      ]
      expect(linhasParaDias([linha], mapeamento)).toEqual([])
    }
  )
})

describe('deduparPorCarimbo', () => {
  function pedido(overrides: Partial<PedidoDiaBruto>): PedidoDiaBruto {
    return {
      carimbo: null,
      nome: 'João',
      semanaTexto: '10/08/2026 a 14/08/2026',
      data: '2026-08-10',
      turno: null,
      tamanho: null,
      prato: 'Frango',
      observacao: null,
      whatsapp: null,
      ...overrides,
    }
  }

  it('mantém a linha de carimbo mais recente entre reenvios', () => {
    const linhas = [
      pedido({ carimbo: new Date('2026-08-10T10:00:00Z'), prato: 'Frango' }),
      pedido({ carimbo: new Date('2026-08-10T15:00:00Z'), prato: 'Peixe' }),
    ]
    const resultado = deduparPorCarimbo(linhas)
    expect(resultado).toHaveLength(1)
    expect(resultado[0]?.prato).toBe('Peixe')
  })

  it('sem carimbo, a última do arquivo vence', () => {
    const linhas = [
      pedido({ carimbo: null, prato: 'Frango' }),
      pedido({ carimbo: null, prato: 'Peixe' }),
    ]
    expect(deduparPorCarimbo(linhas)[0]?.prato).toBe('Peixe')
  })

  it('não mistura pessoas ou dias diferentes', () => {
    const linhas = [
      pedido({ nome: 'João', data: '2026-08-10' }),
      pedido({ nome: 'Maria', data: '2026-08-10' }),
      pedido({ nome: 'João', data: '2026-08-11' }),
    ]
    expect(deduparPorCarimbo(linhas)).toHaveLength(3)
  })
})

describe('ehRecusa', () => {
  it('reconhece o marcador de recusa de almoço', () => {
    expect(ehRecusa('***NÃO VOU ALMOÇAR***')).toBe(true)
  })

  it('reconhece variantes sem asteriscos e em minúsculas', () => {
    expect(ehRecusa('não vou jantar hoje')).toBe(true)
  })

  it('não confunde um prato normal com recusa', () => {
    expect(ehRecusa('Frango grelhado')).toBe(false)
  })

  it('trata null/vazio como não-recusa', () => {
    expect(ehRecusa(null)).toBe(false)
    expect(ehRecusa('')).toBe(false)
  })
})

describe('sugerirCorrespondencia', () => {
  const existentes = [
    { id: '1', nome: 'João da Silva' },
    { id: '2', nome: 'Maria Oliveira' },
  ]

  it('sugere correspondência exata ignorando acento e caixa', () => {
    expect(sugerirCorrespondencia('joao da silva', existentes)).toEqual({
      colaboradorId: '1',
      nome: 'João da Silva',
      tipo: 'exata',
    })
  })

  it('sugere correspondência próxima para pequeno erro de digitação', () => {
    expect(sugerirCorrespondencia('João da Silv', existentes)).toEqual({
      colaboradorId: '1',
      nome: 'João da Silva',
      tipo: 'proxima',
    })
  })

  it('não sugere nada para um nome muito diferente', () => {
    expect(sugerirCorrespondencia('Pedro Almeida', existentes)).toBeNull()
  })

  it('não sugere nada sem colaboradores existentes', () => {
    expect(sugerirCorrespondencia('João', [])).toBeNull()
  })
})
