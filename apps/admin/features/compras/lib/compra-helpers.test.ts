import { describe, expect, it } from 'vitest'

import {
  calcularVencimento,
  diasDoPrazo,
  entregaAtrasada,
  filtrarCompras,
  somarDias,
  totalCompra,
  totalLinha,
} from './compra-helpers'

describe('totalLinha / totalCompra', () => {
  it('multiplica quantidade por valor unitário', () => {
    expect(totalLinha({ quantidade: 10, valorUnitario: 9 })).toBe(90)
  })

  it('soma várias linhas', () => {
    expect(
      totalCompra([
        { quantidade: 10, valorUnitario: 9 },
        { quantidade: 5, valorUnitario: 20 },
      ])
    ).toBe(190)
  })

  it('não deixa resíduo de float em quantidade decimal', () => {
    expect(
      totalCompra([
        { quantidade: 1.15, valorUnitario: 3.7 },
        { quantidade: 0.35, valorUnitario: 8.9 },
      ])
    ).toBe(7.37)
  })

  it('ignora linha zerada sem quebrar o total', () => {
    expect(
      totalCompra([
        { quantidade: 0, valorUnitario: 50 },
        { quantidade: 2, valorUnitario: 10 },
      ])
    ).toBe(20)
  })

  it('devolve zero para nota sem linhas', () => {
    expect(totalCompra([])).toBe(0)
  })
})

describe('diasDoPrazo', () => {
  it('lê o número do texto livre do fornecedor', () => {
    expect(diasDoPrazo('30 dias')).toBe(30)
    expect(diasDoPrazo('15/30/45')).toBe(15)
  })

  it('trata condição sem número como pagamento imediato', () => {
    expect(diasDoPrazo('à vista')).toBe(0)
    expect(diasDoPrazo(null)).toBe(0)
    expect(diasDoPrazo('')).toBe(0)
  })

  it('limita prazo absurdo a um ano', () => {
    expect(diasDoPrazo('9999 dias')).toBe(365)
  })
})

describe('somarDias', () => {
  it('soma sem escorregar de dia por fuso', () => {
    expect(somarDias('2026-11-08', 30)).toBe('2026-12-08')
  })

  it('atravessa a virada do ano', () => {
    expect(somarDias('2026-12-20', 15)).toBe('2027-01-04')
  })

  it('respeita ano bissexto', () => {
    expect(somarDias('2028-02-28', 1)).toBe('2028-02-29')
  })

  it('devolve o mesmo dia quando o prazo é zero', () => {
    expect(somarDias('2026-08-07', 0)).toBe('2026-08-07')
  })
})

describe('calcularVencimento', () => {
  it('usa o prazo de pagamento do fornecedor', () => {
    expect(calcularVencimento('2026-08-07', '30 dias')).toBe('2026-09-06')
  })

  it('vence no próprio dia quando é à vista', () => {
    expect(calcularVencimento('2026-08-07', 'à vista')).toBe('2026-08-07')
  })
})

describe('entregaAtrasada', () => {
  const hoje = '2026-08-07'

  it('acusa atraso quando o prazo de entrega já passou', () => {
    expect(
      entregaAtrasada(
        { status: 'aguardando_entrega', dataPedido: '2026-08-01', prazoEntregaDias: 3 },
        hoje
      )
    ).toBe(true)
  })

  it('não acusa atraso dentro do prazo', () => {
    expect(
      entregaAtrasada(
        { status: 'pedido_feito', dataPedido: '2026-08-06', prazoEntregaDias: 3 },
        hoje
      )
    ).toBe(false)
  })

  it('não acusa atraso no último dia do prazo', () => {
    expect(
      entregaAtrasada(
        { status: 'pedido_feito', dataPedido: '2026-08-04', prazoEntregaDias: 3 },
        hoje
      )
    ).toBe(false)
  })

  it('não acusa atraso em compra já recebida ou cancelada', () => {
    const antiga = { dataPedido: '2026-01-01', prazoEntregaDias: 1 }
    expect(entregaAtrasada({ ...antiga, status: 'recebido' }, hoje)).toBe(false)
    expect(entregaAtrasada({ ...antiga, status: 'cancelado' }, hoje)).toBe(false)
  })

  it('cobra entrega no mesmo dia quando o fornecedor não tem prazo', () => {
    expect(
      entregaAtrasada(
        { status: 'pedido_feito', dataPedido: '2026-08-06', prazoEntregaDias: null },
        hoje
      )
    ).toBe(true)
  })
})

describe('filtrarCompras', () => {
  const compras = [
    { fornecedorNome: 'Atacadão Central', numeroNotaFiscal: '1234', status: 'recebido' as const },
    { fornecedorNome: 'Hortifruti do Zé', numeroNotaFiscal: null, status: 'pedido_feito' as const },
    { fornecedorNome: 'Frigorífico Sul', numeroNotaFiscal: '9876', status: 'cancelado' as const },
  ]

  it('devolve tudo sem filtro', () => {
    expect(filtrarCompras(compras, {})).toHaveLength(3)
  })

  it('filtra por status', () => {
    expect(filtrarCompras(compras, { status: 'recebido' })).toHaveLength(1)
  })

  it('busca por nome do fornecedor sem diferenciar caixa', () => {
    expect(filtrarCompras(compras, { busca: 'hortifruti' })).toHaveLength(1)
  })

  it('busca por número da nota', () => {
    expect(filtrarCompras(compras, { busca: '9876' })[0]?.fornecedorNome).toBe(
      'Frigorífico Sul'
    )
  })

  it('não quebra em compra sem número de nota', () => {
    expect(filtrarCompras(compras, { busca: '123' })).toHaveLength(1)
  })

  it('combina busca e status', () => {
    expect(
      filtrarCompras(compras, { busca: 'atacadão', status: 'pedido_feito' })
    ).toHaveLength(0)
  })
})
