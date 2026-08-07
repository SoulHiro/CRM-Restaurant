import { describe, expect, it } from 'vitest'

import {
  DIAS_ALERTA_VENCIMENTO,
  diasAteVencer,
  filterEstoque,
  nivelEstoque,
  parseEstoqueFilters,
  selecionarAlertas,
} from './estoque-helpers'
import type { EstoqueItem } from './types'

function item(overrides: Partial<EstoqueItem> = {}): EstoqueItem {
  return {
    id: 'i1',
    nome: 'Arroz',
    unidade: 'kg',
    quantidadeAtual: 20,
    pontoReposicao: 5,
    tamanhoEmbalagem: null,
    validade: null,
    fornecedorPadraoId: null,
    fornecedorPadraoNome: null,
    ativo: true,
    criadoEm: '2026-08-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('nivelEstoque', () => {
  it('marca zerado quando não há saldo', () => {
    expect(nivelEstoque({ quantidadeAtual: 0, pontoReposicao: 5 })).toBe(
      'zerado'
    )
  })

  it('marca zerado também com saldo negativo', () => {
    expect(nivelEstoque({ quantidadeAtual: -2, pontoReposicao: 5 })).toBe(
      'zerado'
    )
  })

  it('marca baixo quando encosta no ponto de reposição', () => {
    expect(nivelEstoque({ quantidadeAtual: 5, pontoReposicao: 5 })).toBe('baixo')
  })

  it('marca ok acima do ponto de reposição', () => {
    expect(nivelEstoque({ quantidadeAtual: 5.001, pontoReposicao: 5 })).toBe(
      'ok'
    )
  })

  it('nunca é baixo quando o ponto de reposição é zero', () => {
    expect(nivelEstoque({ quantidadeAtual: 1, pontoReposicao: 0 })).toBe('ok')
  })
})

describe('diasAteVencer', () => {
  it('conta zero no próprio dia do vencimento', () => {
    expect(diasAteVencer('2026-08-06', '2026-08-06')).toBe(0)
  })

  it('atravessa virada de mês', () => {
    expect(diasAteVencer('2026-09-02', '2026-08-31')).toBe(2)
  })

  it('atravessa virada de ano', () => {
    expect(diasAteVencer('2027-01-01', '2026-12-30')).toBe(2)
  })

  it('cobre 29 de fevereiro em ano bissexto', () => {
    expect(diasAteVencer('2028-03-01', '2028-02-28')).toBe(2)
  })

  it('devolve negativo para item já vencido', () => {
    expect(diasAteVencer('2026-08-01', '2026-08-06')).toBe(-5)
  })

  it('ignora a parte de hora quando recebe timestamp', () => {
    expect(diasAteVencer('2026-08-09T00:00:00.000Z', '2026-08-06')).toBe(3)
  })
})

describe('selecionarAlertas', () => {
  const hoje = '2026-08-06'

  it('junta itens zerados e baixos, do menor saldo para o maior', () => {
    const { estoqueBaixo } = selecionarAlertas(
      [
        item({ id: 'a', quantidadeAtual: 4, pontoReposicao: 5 }),
        item({ id: 'b', quantidadeAtual: 0, pontoReposicao: 5 }),
        item({ id: 'c', quantidadeAtual: 50, pontoReposicao: 5 }),
      ],
      hoje
    )

    expect(estoqueBaixo.map((a) => a.itemId)).toEqual(['b', 'a'])
    expect(estoqueBaixo[0]?.nivel).toBe('zerado')
    expect(estoqueBaixo[1]?.nivel).toBe('baixo')
  })

  it('ignora item inativo nos dois alertas', () => {
    const alertas = selecionarAlertas(
      [
        item({ id: 'a', quantidadeAtual: 0, ativo: false }),
        item({ id: 'b', validade: '2026-08-07', ativo: false }),
      ],
      hoje
    )

    expect(alertas.estoqueBaixo).toHaveLength(0)
    expect(alertas.vencimentoProximo).toHaveLength(0)
  })

  it('inclui o item exatamente na borda da janela e exclui o dia seguinte', () => {
    const { vencimentoProximo } = selecionarAlertas(
      [
        item({ id: 'borda', validade: '2026-08-09' }),
        item({ id: 'fora', validade: '2026-08-10' }),
      ],
      hoje
    )

    expect(DIAS_ALERTA_VENCIMENTO).toBe(3)
    expect(vencimentoProximo.map((a) => a.itemId)).toEqual(['borda'])
  })

  it('inclui item já vencido, com dias negativos, primeiro na lista', () => {
    const { vencimentoProximo } = selecionarAlertas(
      [
        item({ id: 'amanha', validade: '2026-08-07' }),
        item({ id: 'vencido', validade: '2026-08-01' }),
      ],
      hoje
    )

    expect(vencimentoProximo.map((a) => a.itemId)).toEqual([
      'vencido',
      'amanha',
    ])
    expect(vencimentoProximo[0]?.diasRestantes).toBe(-5)
  })

  it('ignora item sem validade', () => {
    const { vencimentoProximo } = selecionarAlertas(
      [item({ validade: null })],
      hoje
    )
    expect(vencimentoProximo).toHaveLength(0)
  })
})

describe('parseEstoqueFilters', () => {
  it('aplica os padrões quando não há nada na URL', () => {
    expect(parseEstoqueFilters({})).toEqual({
      q: '',
      unidade: '',
      nivel: '',
      vencendo: false,
      incluirInativos: false,
      sort: 'nome-asc',
      page: 1,
      pageSize: 25,
    })
  })

  it('descarta valores inválidos em vez de propagá-los', () => {
    const filters = parseEstoqueFilters({
      pageSize: '999',
      sort: 'inventado',
      nivel: 'critico',
      page: '-3',
    })

    expect(filters.pageSize).toBe(25)
    expect(filters.sort).toBe('nome-asc')
    expect(filters.nivel).toBe('')
    expect(filters.page).toBe(1)
  })

  it('lê valores válidos, incluindo as flags', () => {
    const filters = parseEstoqueFilters({
      q: 'coca',
      unidade: 'un',
      nivel: 'baixo',
      vencendo: '1',
      inativos: '1',
      sort: 'saldo-asc',
      page: '3',
      pageSize: '50',
    })

    expect(filters).toEqual({
      q: 'coca',
      unidade: 'un',
      nivel: 'baixo',
      vencendo: true,
      incluirInativos: true,
      sort: 'saldo-asc',
      page: 3,
      pageSize: 50,
    })
  })

  it('ignora parâmetro repetido (array) em vez de quebrar', () => {
    expect(parseEstoqueFilters({ q: ['a', 'b'] }).q).toBe('')
  })
})

describe('filterEstoque', () => {
  const hoje = '2026-08-06'
  const base = parseEstoqueFilters({})

  const itens = [
    item({ id: 'a', nome: 'Arroz', quantidadeAtual: 20, pontoReposicao: 5 }),
    item({
      id: 'b',
      nome: 'Coca-Cola 2L',
      unidade: 'un',
      quantidadeAtual: 2,
      pontoReposicao: 12,
      validade: '2026-08-08',
    }),
    item({
      id: 'c',
      nome: 'Alface',
      unidade: 'un',
      quantidadeAtual: 0,
      pontoReposicao: 3,
      validade: '2026-12-01',
    }),
    item({ id: 'd', nome: 'Óleo', unidade: 'l', ativo: false }),
  ]

  it('esconde inativos por padrão e mostra com a flag', () => {
    expect(filterEstoque(itens, base, hoje).total).toBe(3)
    expect(
      filterEstoque(itens, { ...base, incluirInativos: true }, hoje).total
    ).toBe(4)
  })

  it('busca por nome sem diferenciar maiúscula', () => {
    const result = filterEstoque(itens, { ...base, q: 'COCA' }, hoje)
    expect(result.items.map((i) => i.id)).toEqual(['b'])
  })

  it('filtra por nível de estoque', () => {
    expect(
      filterEstoque(itens, { ...base, nivel: 'zerado' }, hoje).items.map(
        (i) => i.id
      )
    ).toEqual(['c'])
    expect(
      filterEstoque(itens, { ...base, nivel: 'baixo' }, hoje).items.map(
        (i) => i.id
      )
    ).toEqual(['b'])
  })

  it('filtra por unidade', () => {
    const result = filterEstoque(itens, { ...base, unidade: 'un' }, hoje)
    expect(result.items.map((i) => i.id)).toEqual(['c', 'b'])
  })

  it('filtra por vencimento próximo, ignorando item sem validade', () => {
    const result = filterEstoque(itens, { ...base, vencendo: true }, hoje)
    expect(result.items.map((i) => i.id)).toEqual(['b'])
  })

  it('ordena por menor saldo e por validade, jogando sem-validade para o fim', () => {
    expect(
      filterEstoque(itens, { ...base, sort: 'saldo-asc' }, hoje).items.map(
        (i) => i.id
      )
    ).toEqual(['c', 'b', 'a'])

    expect(
      filterEstoque(itens, { ...base, sort: 'validade-asc' }, hoje).items.map(
        (i) => i.id
      )
    ).toEqual(['b', 'c', 'a'])
  })

  it('pagina e devolve as unidades disponíveis do conjunto completo', () => {
    const result = filterEstoque(itens, { ...base, pageSize: 10, page: 1 }, hoje)
    expect(result.unidadesDisponiveis).toEqual(['kg', 'l', 'un'])

    const pagina2 = filterEstoque(
      itens,
      { ...base, pageSize: 10, page: 2 },
      hoje
    )
    expect(pagina2.page).toBe(1)
    expect(pagina2.totalPages).toBe(1)
  })

  it('grampeia a página pedida ao total de páginas existente', () => {
    const result = filterEstoque(
      itens,
      { ...base, pageSize: 10, page: 99 },
      hoje
    )
    expect(result.page).toBe(1)
    expect(result.items).toHaveLength(3)
  })
})
