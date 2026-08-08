import { arredondarMoeda } from '@/lib/numeric'

import { COMPRA_STATUS, type CompraStatus } from './types'

export const COMPRA_STATUS_LABEL: Record<CompraStatus, string> = {
  pedido_feito: 'Pedido feito',
  aguardando_entrega: 'Aguardando entrega',
  recebido: 'Recebido',
  cancelado: 'Cancelado',
}

export type CompraFiltro = CompraStatus | 'todos'

export const COMPRA_FILTROS: CompraFiltro[] = ['todos', ...COMPRA_STATUS]

export function parseCompraFiltro(
  valor: string | string[] | undefined
): CompraFiltro {
  return typeof valor === 'string' &&
    (COMPRA_FILTROS as string[]).includes(valor)
    ? (valor as CompraFiltro)
    : 'todos'
}

interface LinhaValorizada {
  quantidade: number
  valorUnitario: number
}

export function totalLinha(linha: LinhaValorizada): number {
  return arredondarMoeda(linha.quantidade * linha.valorUnitario)
}

export function totalCompra(linhas: readonly LinhaValorizada[]): number {
  return arredondarMoeda(
    linhas.reduce((soma, linha) => soma + linha.quantidade * linha.valorUnitario, 0)
  )
}

/**
 * `prazo_pagamento` do fornecedor é texto livre ("30 dias", "à vista",
 * "15/30") porque é assim que a condição vem na conversa. Aqui só o primeiro
 * número importa; sem número, o vencimento é o próprio dia do pedido.
 */
export function diasDoPrazo(prazo: string | null | undefined): number {
  if (!prazo) return 0
  const encontrado = /\d+/.exec(prazo)
  if (!encontrado) return 0
  return Math.min(Number(encontrado[0]), 365)
}

const DIA_EM_MS = 86_400_000

/** Soma dias a um dia de calendário `YYYY-MM-DD` sem passar por fuso. */
export function somarDias(dataISO: string, dias: number): string {
  const [ano, mes, dia] = dataISO.split('-').map(Number)
  if (!ano || !mes || !dia) return dataISO
  const base = Date.UTC(ano, mes - 1, dia) + dias * DIA_EM_MS
  return new Date(base).toISOString().slice(0, 10)
}

export function calcularVencimento(
  dataPedido: string,
  prazoPagamento: string | null | undefined
): string {
  return somarDias(dataPedido, diasDoPrazo(prazoPagamento))
}

interface CompraEntrega {
  status: CompraStatus
  dataPedido: string
  prazoEntregaDias: number | null
}

/**
 * Entrega atrasada é derivada, nunca gravada: um status guardado no banco
 * viraria mentira no dia seguinte sem um job para atualizá-lo — mesma regra do
 * "estoque baixo" e da "conta atrasada".
 */
export function entregaAtrasada(compra: CompraEntrega, hoje: string): boolean {
  if (compra.status === 'recebido' || compra.status === 'cancelado') return false
  const previsto = somarDias(compra.dataPedido, compra.prazoEntregaDias ?? 0)
  return previsto < hoje
}

interface CompraFiltravel {
  fornecedorNome: string
  numeroNotaFiscal: string | null
  status: CompraStatus
}

export function filtrarCompras<T extends CompraFiltravel>(
  compras: readonly T[],
  filtros: { busca?: string; status?: CompraStatus | 'todos' }
): T[] {
  const busca = filtros.busca?.trim().toLowerCase() ?? ''
  const status = filtros.status ?? 'todos'

  return compras.filter((compra) => {
    if (status !== 'todos' && compra.status !== status) return false
    if (!busca) return true
    return (
      compra.fornecedorNome.toLowerCase().includes(busca) ||
      (compra.numeroNotaFiscal?.toLowerCase().includes(busca) ?? false)
    )
  })
}
