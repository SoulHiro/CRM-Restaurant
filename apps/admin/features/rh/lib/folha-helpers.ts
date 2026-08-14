import { formatShortDateBR } from '@/lib/formatters'
import { arredondarMoeda } from '@/lib/numeric'

import {
  primeiroDiaDoMes,
  SABADO,
  semanasPagasNaCompetencia,
  ultimoDiaDoMes,
} from './ausencia-helpers'
import { salarioVigenteEm } from './salario-helpers'
import type { BeneficioTipo, FolhaItemTipo, LinhaFolhaPrevia } from './types'

export const BENEFICIO_LABELS: Record<BeneficioTipo, string> = {
  vale_transporte: 'Vale transporte',
  vale_refeicao: 'Vale refeição',
  bonus: 'Bônus',
  outro: 'Outro',
}

const MESES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
] as const

export function rotuloCompetencia(competencia: string): string {
  const [ano, mes] = competencia.split('-').map(Number)
  if (!ano || !mes || mes < 1 || mes > 12) return competencia
  return `${MESES[mes - 1]} de ${ano}`
}

export function competenciaDe(data: string): string {
  return data.slice(0, 7)
}

export function competenciaAnterior(competencia: string): string {
  const [ano, mes] = competencia.split('-').map(Number)
  if (!ano || !mes) return competencia
  return new Date(Date.UTC(ano, mes - 2, 1)).toISOString().slice(0, 7)
}

/** Vencimento padrão: dia 5 do mês seguinte ao trabalhado. */
export function vencimentoPadrao(competencia: string): string {
  const [ano, mes] = competencia.split('-').map(Number)
  if (!ano || !mes) return `${competencia}-05`
  return new Date(Date.UTC(ano, mes, 5)).toISOString().slice(0, 10)
}

interface FuncionarioParaFolha {
  id: string
  nome: string
  cargoNome: string
  dataAdmissao: string
  dataDesligamento: string | null
  salarios: { valor: number; vigenteDesde: string }[]
  beneficios: {
    tipo: BeneficioTipo
    valor: number
    recorrente: boolean
    ativo: boolean
  }[]
  ausencias: { dataInicio: string; dataFim: string }[]
  entregador: { valorDiaria: number; folgaSemanal: number | null } | null
}

/**
 * Entrou depois do mês acabar, ou saiu antes dele começar: não é folha deste
 * mês. Quem foi desligado no meio do mês continua entrando — a rescisão é
 * ajustada na prévia, que é editável, e não por uma regra que chuta o valor.
 */
function participaDaCompetencia(
  funcionario: FuncionarioParaFolha,
  competencia: string
): boolean {
  if (funcionario.dataAdmissao > ultimoDiaDoMes(competencia)) return false
  if (
    funcionario.dataDesligamento &&
    funcionario.dataDesligamento < primeiroDiaDoMes(competencia)
  ) {
    return false
  }
  return true
}

/**
 * Monta a prévia da competência. O valor de cada linha é uma proposta: a tela
 * deixa editar antes de fechar, porque folha real sempre tem ajuste.
 *
 * Entregador recebe por semana, então vira uma linha por semana de segunda a
 * sábado — domingo não se trabalha, e a folga fixa e as ausências saem da
 * conta. O rodízio de sábado não é dia fixo de ninguém: entra como ausência do
 * tipo `folga` quando acontece. Mensalista continua numa linha só.
 */
export function montarPreviaFolha(
  funcionarios: readonly FuncionarioParaFolha[],
  competencia: string,
  /** Dia da semana em que o entregador recebe (0 = domingo … 6 = sábado). */
  diaPagamentoSemanal = SABADO,
  /** Vencimento do mensalista; a linha semanal calcula o seu próprio. */
  vencimentoMensal = vencimentoPadrao(competencia)
): LinhaFolhaPrevia[] {
  const fimDoMes = ultimoDiaDoMes(competencia)
  const linhas: LinhaFolhaPrevia[] = []

  for (const funcionario of funcionarios) {
    if (!participaDaCompetencia(funcionario, competencia)) continue

    const base = {
      funcionarioId: funcionario.id,
      funcionarioNome: funcionario.nome,
      cargoNome: funcionario.cargoNome,
    }

    if (funcionario.entregador) {
      const valorDiaria = funcionario.entregador.valorDiaria

      // Uma linha por semana paga no mês: o entregador recebe semanalmente,
      // então cada semana vira sua própria conta a pagar.
      for (const semana of semanasPagasNaCompetencia({
        ausencias: funcionario.ausencias,
        folgaSemanal: funcionario.entregador.folgaSemanal,
        competencia,
        diaPagamento: diaPagamentoSemanal,
        desde: funcionario.dataAdmissao,
        ate: funcionario.dataDesligamento,
      })) {
        linhas.push({
          ...base,
          tipo: 'diaria',
          descricao: `${formatShortDateBR(semana.inicio)} a ${formatShortDateBR(semana.fim)} · ${semana.diarias} ${semana.diarias === 1 ? 'diária' : 'diárias'}`,
          valor: arredondarMoeda(semana.diarias * valorDiaria),
          quantidade: semana.diarias,
          valorUnitario: valorDiaria,
          dataVencimento: semana.vencimento,
        })
      }
    } else {
      const vigente = salarioVigenteEm(funcionario.salarios, fimDoMes)
      if (vigente) {
        linhas.push({
          ...base,
          tipo: 'salario',
          descricao: 'Salário',
          valor: arredondarMoeda(vigente.valor),
          quantidade: null,
          valorUnitario: null,
          dataVencimento: vencimentoMensal,
        })
      }
    }

    for (const beneficio of funcionario.beneficios) {
      if (!beneficio.ativo || !beneficio.recorrente) continue

      linhas.push({
        ...base,
        tipo: 'beneficio',
        descricao: BENEFICIO_LABELS[beneficio.tipo],
        valor: arredondarMoeda(beneficio.valor),
        quantidade: null,
        valorUnitario: null,
        dataVencimento: vencimentoMensal,
      })
    }
  }

  return linhas.sort(
    (a, b) =>
      a.funcionarioNome.localeCompare(b.funcionarioNome, 'pt-BR') ||
      a.tipo.localeCompare(b.tipo) ||
      a.dataVencimento.localeCompare(b.dataVencimento)
  )
}

export function totalFolha(linhas: readonly { valor: number }[]): number {
  return arredondarMoeda(linhas.reduce((soma, linha) => soma + linha.valor, 0))
}

/**
 * Salário e benefício caem em subtipos diferentes do DRE — sem isso o custo
 * de pessoal apareceria todo como "salário" e o vale transporte sumiria.
 */
export function subtipoDespesa(
  tipo: FolhaItemTipo,
  descricao: string
): 'salario' | 'vale_transporte' | 'outro' {
  if (tipo === 'salario' || tipo === 'diaria') return 'salario'
  if (descricao === BENEFICIO_LABELS.vale_transporte) return 'vale_transporte'
  return 'outro'
}
