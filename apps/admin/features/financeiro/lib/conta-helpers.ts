import { arredondarMoeda } from '@/lib/numeric'
import type {
  ContaPagar,
  ContaReceber,
  ContaStatus,
  ResumoContas,
  StatusConta,
} from './types'

interface ContaBase {
  status: ContaStatus
  dataVencimento: string
}

/**
 * "Atrasado" é derivado, nunca guardado: uma conta pendente cujo vencimento
 * já passou está atrasada. Guardar isso no banco exigiria um job diário para
 * virar o status e, sem ele, o dado ficaria mentindo.
 */
export function statusConta(conta: ContaBase, hoje: string): StatusConta {
  if (conta.status === 'pago') return 'pago'
  return conta.dataVencimento < hoje ? 'atrasado' : 'pendente'
}

const MS_POR_DIA = 86_400_000

/** Positivo = dias em atraso. Negativo = ainda falta esse tanto pra vencer. */
export function diasEmAtraso(dataVencimento: string, hoje: string): number {
  const venc = Date.parse(`${dataVencimento.slice(0, 10)}T00:00:00Z`)
  const agora = Date.parse(`${hoje.slice(0, 10)}T00:00:00Z`)
  return Math.round((agora - venc) / MS_POR_DIA)
}

export function rotuloPrazo(dataVencimento: string, hoje: string): string {
  const dias = diasEmAtraso(dataVencimento, hoje)
  if (dias > 1) return `${dias} dias em atraso`
  if (dias === 1) return 'Venceu ontem'
  if (dias === 0) return 'Vence hoje'
  if (dias === -1) return 'Vence amanhã'
  return `Faltam ${Math.abs(dias)} dias`
}

export function resumirContas(
  pagar: ContaPagar[],
  receber: ContaReceber[],
  hoje: string
): ResumoContas {
  let pagarPendente = 0
  let pagarAtrasado = 0
  let pagarAtrasadoQtd = 0
  let receberPendente = 0
  let receberAtrasado = 0
  let receberAtrasadoQtd = 0

  for (const conta of pagar) {
    if (conta.status === 'pago') continue
    pagarPendente += conta.valor
    if (statusConta(conta, hoje) === 'atrasado') {
      pagarAtrasado += conta.valor
      pagarAtrasadoQtd++
    }
  }

  for (const conta of receber) {
    if (conta.status === 'pago') continue
    receberPendente += conta.valor
    if (statusConta(conta, hoje) === 'atrasado') {
      receberAtrasado += conta.valor
      receberAtrasadoQtd++
    }
  }

  return {
    pagarPendente: arredondarMoeda(pagarPendente),
    pagarAtrasado: arredondarMoeda(pagarAtrasado),
    pagarAtrasadoQtd,
    receberPendente: arredondarMoeda(receberPendente),
    receberAtrasado: arredondarMoeda(receberAtrasado),
    receberAtrasadoQtd,
  }
}

/**
 * Ordem de trabalho, não ordem de cadastro: o que está atrasado há mais tempo
 * vem primeiro, depois o que vence antes, e o que já foi pago desce pro fim.
 */
export function ordenarPorUrgencia<T extends ContaBase>(contas: T[]): T[] {
  return [...contas].sort((a, b) => {
    const aPago = a.status === 'pago'
    const bPago = b.status === 'pago'
    if (aPago !== bPago) return aPago ? 1 : -1
    return a.dataVencimento.localeCompare(b.dataVencimento)
  })
}

export const CONTA_FILTROS = ['todas', 'pendente', 'atrasado', 'pago'] as const
export type ContaFiltro = (typeof CONTA_FILTROS)[number]

export function filtrarContas<T extends ContaBase>(
  contas: T[],
  filtro: ContaFiltro,
  hoje: string
): T[] {
  if (filtro === 'todas') return contas
  return contas.filter((conta) => statusConta(conta, hoje) === filtro)
}

export function parseContaFiltro(valor: string | string[] | undefined): ContaFiltro {
  return typeof valor === 'string' &&
    (CONTA_FILTROS as readonly string[]).includes(valor)
    ? (valor as ContaFiltro)
    : 'todas'
}
