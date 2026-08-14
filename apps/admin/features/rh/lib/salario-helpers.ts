import type {
  ModeloContratual,
  MotivoDesligamento,
  MotivoSalario,
  TurnoTrabalho,
} from './types'

export const MOTIVO_DESLIGAMENTO_LABELS: Record<MotivoDesligamento, string> = {
  dispensado_sem_justa_causa: 'Dispensado sem justa causa',
  dispensado_com_justa_causa: 'Dispensado com justa causa',
  pedido_demissao: 'Pediu demissão',
  fim_contrato: 'Fim do contrato',
}

export const TURNO_LABELS: Record<TurnoTrabalho, string> = {
  dia: 'Dia',
  noite: 'Noite',
  ambos: 'Dia e noite',
}

export const MODELO_LABELS: Record<ModeloContratual, string> = {
  CLT: 'CLT',
  PJ: 'PJ',
  MEI: 'MEI',
  temporario: 'Temporário',
  estagio: 'Estágio',
  informal: 'Informal',
}

export const MOTIVO_SALARIO_LABELS: Record<MotivoSalario, string> = {
  admissao: 'Admissão',
  reajuste: 'Reajuste',
  promocao: 'Promoção',
  acordo: 'Acordo',
}

interface Vigencia {
  valor: number
  vigenteDesde: string
}

/**
 * Salário vigente numa data: a última vigência que já começou naquele dia.
 * É o que impede um reajuste de hoje reescrever a folha de um mês fechado —
 * a folha de março pergunta pelo salário de março, não pelo de agora.
 *
 * `null` quando a data é anterior à primeira vigência (ou não há nenhuma):
 * zero mentiria, seria "trabalhou de graça".
 */
export function salarioVigenteEm<T extends Vigencia>(
  vigencias: readonly T[],
  data: string
): T | null {
  let escolhida: T | null = null

  for (const vigencia of vigencias) {
    if (vigencia.vigenteDesde > data) continue
    if (!escolhida || vigencia.vigenteDesde > escolhida.vigenteDesde) {
      escolhida = vigencia
    }
  }

  return escolhida
}

export function ordenarVigencias<T extends Vigencia>(
  vigencias: readonly T[]
): T[] {
  return [...vigencias].sort((a, b) =>
    b.vigenteDesde.localeCompare(a.vigenteDesde)
  )
}

const DIA_EM_MS = 86_400_000

/** Dias corridos entre dois dias de calendário, sem passar por fuso. */
export function diasEntre(inicio: string, fim: string): number {
  const [ai, mi, di] = inicio.split('-').map(Number)
  const [af, mf, df] = fim.split('-').map(Number)
  if (!ai || !mi || !di || !af || !mf || !df) return 0

  return Math.round(
    (Date.UTC(af, mf - 1, df) - Date.UTC(ai, mi - 1, di)) / DIA_EM_MS
  )
}

/**
 * Meses de calendário, não dias divididos por uma média: com 30,44 dias por
 * mês, um ano fechado daria 11 meses e "1 ano" nunca apareceria.
 */
export function mesesEntre(inicio: string, fim: string): number {
  const [ai, mi, di] = inicio.split('-').map(Number)
  const [af, mf, df] = fim.split('-').map(Number)
  if (!ai || !mi || !di || !af || !mf || !df) return 0

  const meses = (af - ai) * 12 + (mf - mi)
  // Ainda não chegou o dia do mês: o mês corrente não completou.
  return df < di ? meses - 1 : meses
}

/** "3 anos e 2 meses" — o número que interessa numa conversa de RH. */
export function tempoDeCasa(dataAdmissao: string, hoje: string): string {
  const dias = diasEntre(dataAdmissao, hoje)
  if (dias < 0) return 'ainda não começou'
  if (dias < 30) return `${dias} ${dias === 1 ? 'dia' : 'dias'}`

  const meses = mesesEntre(dataAdmissao, hoje)
  if (meses < 12) return `${meses} ${meses === 1 ? 'mês' : 'meses'}`

  const anos = Math.floor(meses / 12)
  const resto = meses % 12
  const rotuloAnos = `${anos} ${anos === 1 ? 'ano' : 'anos'}`
  if (resto === 0) return rotuloAnos

  return `${rotuloAnos} e ${resto} ${resto === 1 ? 'mês' : 'meses'}`
}

interface Filtravel {
  nome: string
  cargoId: string
  turno: TurnoTrabalho
  status: 'ativo' | 'desligado'
}

export function filtrarFuncionarios<T extends Filtravel>(
  funcionarios: readonly T[],
  filtros: {
    busca?: string
    cargoId?: string
    turno?: TurnoTrabalho | 'todos'
    status?: 'ativo' | 'desligado' | 'todos'
  }
): T[] {
  const busca = filtros.busca?.trim().toLowerCase() ?? ''
  const status = filtros.status ?? 'ativo'
  const turno = filtros.turno ?? 'todos'

  return funcionarios.filter((funcionario) => {
    if (status !== 'todos' && funcionario.status !== status) return false
    if (turno !== 'todos' && funcionario.turno !== turno) return false
    if (filtros.cargoId && funcionario.cargoId !== filtros.cargoId) return false
    if (busca && !funcionario.nome.toLowerCase().includes(busca)) return false
    return true
  })
}
