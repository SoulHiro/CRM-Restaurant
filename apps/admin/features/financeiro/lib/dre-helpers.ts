import { arredondarMoeda } from '@/lib/numeric'
import type {
  DRE,
  DespesaSubtipo,
  FatiaOrigem,
  FatiaSubtipo,
  Transacao,
  TransacaoOrigem,
} from './types'

export const ORIGEM_LABELS: Record<TransacaoOrigem, string> = {
  manual: 'Lançado à mão',
  anotai: 'AnotaAí',
  ifood: 'iFood',
  pagbank: 'PagBank',
  marmita_b2b: 'Marmita B2B',
}

export const SUBTIPO_LABELS: Record<DespesaSubtipo, string> = {
  aluguel: 'Aluguel',
  salario: 'Salário',
  vale_transporte: 'Vale-transporte',
  imposto: 'Imposto',
  fornecedor: 'Fornecedor',
  insumo: 'Insumo',
  equipamento: 'Equipamento',
  manutencao: 'Manutenção',
  taxa_plataforma: 'Taxa de plataforma',
  outro: 'Outro',
}

export const CATEGORIA_LABELS = {
  fixa: 'Fixa',
  variavel: 'Variável',
} as const

/** 'YYYY-MM' do mês corrente, a partir de uma data 'YYYY-MM-DD'. */
export function mesDe(dataISO: string): string {
  return dataISO.slice(0, 7)
}

export function mesAnterior(mes: string): string {
  const [ano, m] = mes.split('-').map(Number)
  if (!ano || !m) return mes
  return m === 1
    ? `${ano - 1}-12`
    : `${ano}-${String(m - 1).padStart(2, '0')}`
}

export function mesSeguinte(mes: string): string {
  const [ano, m] = mes.split('-').map(Number)
  if (!ano || !m) return mes
  return m === 12
    ? `${ano + 1}-01`
    : `${ano}-${String(m + 1).padStart(2, '0')}`
}

const mesFormatter = new Intl.DateTimeFormat('pt-BR', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

export function formatMes(mes: string): string {
  const rotulo = mesFormatter.format(new Date(`${mes}-01T00:00:00Z`))
  return rotulo.charAt(0).toUpperCase() + rotulo.slice(1)
}

export function transacoesDoMes(
  transacoes: Transacao[],
  mes: string
): Transacao[] {
  return transacoes.filter((t) => mesDe(t.data) === mes)
}

/**
 * DRE do conjunto recebido. A fonte é sempre `transacao_financeira` — conta a
 * pagar/receber não entra aqui, só depois de virar transação ao ser paga.
 * É isso que impede o mesmo dinheiro ser contado duas vezes.
 */
export function calcularDRE(transacoes: Transacao[]): DRE {
  let receita = 0
  let despesa = 0
  let despesaFixa = 0
  let despesaVariavel = 0

  for (const t of transacoes) {
    if (t.tipo === 'receita') {
      receita += t.valor
      continue
    }
    despesa += t.valor
    if (t.categoria === 'fixa') despesaFixa += t.valor
    else if (t.categoria === 'variavel') despesaVariavel += t.valor
  }

  return {
    receita: arredondarMoeda(receita),
    despesa: arredondarMoeda(despesa),
    lucro: arredondarMoeda(receita - despesa),
    despesaFixa: arredondarMoeda(despesaFixa),
    despesaVariavel: arredondarMoeda(despesaVariavel),
    pontoEquilibrio: arredondarMoeda(despesaFixa),
    totalLancamentos: transacoes.length,
  }
}

function fatiar<K extends string>(
  entradas: { chave: K; valor: number }[]
): { chave: K; valor: number; percentual: number }[] {
  const total = entradas.reduce((soma, e) => soma + e.valor, 0)

  return entradas
    .map((e) => ({
      chave: e.chave,
      valor: arredondarMoeda(e.valor),
      percentual:
        total > 0 ? Math.round((e.valor / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.valor - a.valor)
}

/** De onde veio a receita — base da "margem por canal". */
export function receitaPorOrigem(transacoes: Transacao[]): FatiaOrigem[] {
  const porOrigem = new Map<TransacaoOrigem, number>()

  for (const t of transacoes) {
    if (t.tipo !== 'receita') continue
    porOrigem.set(t.origem, (porOrigem.get(t.origem) ?? 0) + t.valor)
  }

  return fatiar(
    Array.from(porOrigem, ([chave, valor]) => ({ chave, valor }))
  ).map(({ chave, valor, percentual }) => ({
    origem: chave,
    valor,
    percentual,
  }))
}

/** Para onde foi a despesa, por subtipo. */
export function despesaPorSubtipo(transacoes: Transacao[]): FatiaSubtipo[] {
  const porSubtipo = new Map<DespesaSubtipo, number>()

  for (const t of transacoes) {
    if (t.tipo !== 'despesa') continue
    const chave: DespesaSubtipo = t.subtipo ?? 'outro'
    porSubtipo.set(chave, (porSubtipo.get(chave) ?? 0) + t.valor)
  }

  return fatiar(
    Array.from(porSubtipo, ([chave, valor]) => ({ chave, valor }))
  ).map(({ chave, valor, percentual }) => ({
    subtipo: chave,
    valor,
    percentual,
  }))
}
