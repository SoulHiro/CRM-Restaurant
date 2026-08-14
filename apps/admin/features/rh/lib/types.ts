export const TURNOS_TRABALHO = ['dia', 'noite', 'ambos'] as const
export type TurnoTrabalho = (typeof TURNOS_TRABALHO)[number]

export const MODELOS_CONTRATUAIS = [
  'CLT',
  'PJ',
  'MEI',
  'temporario',
  'estagio',
  'informal',
] as const
export type ModeloContratual = (typeof MODELOS_CONTRATUAIS)[number]

export type FuncionarioStatus = 'ativo' | 'desligado'

export const MOTIVOS_DESLIGAMENTO = [
  'dispensado_sem_justa_causa',
  'dispensado_com_justa_causa',
  'pedido_demissao',
  'fim_contrato',
] as const
export type MotivoDesligamento = (typeof MOTIVOS_DESLIGAMENTO)[number]

export const MOTIVOS_SALARIO = [
  'admissao',
  'reajuste',
  'promocao',
  'acordo',
] as const
export type MotivoSalario = (typeof MOTIVOS_SALARIO)[number]

export const AUSENCIA_TIPOS = [
  'atestado_medico',
  'folga',
  'ferias',
  'falta_justificada',
  'falta_injustificada',
] as const
export type AusenciaTipo = (typeof AUSENCIA_TIPOS)[number]

export const BENEFICIO_TIPOS = [
  'vale_transporte',
  'vale_refeicao',
  'bonus',
  'outro',
] as const
export type BeneficioTipo = (typeof BENEFICIO_TIPOS)[number]

export const FOLHA_ITEM_TIPOS = ['salario', 'diaria', 'beneficio'] as const
export type FolhaItemTipo = (typeof FOLHA_ITEM_TIPOS)[number]

export interface Cargo {
  id: string
  nome: string
  salarioBase: number
  /** Preenchido em cargo que paga por diária, como entregador. */
  valorDiariaPadrao: number | null
  ativo: boolean
  /** Quantos funcionários ativos ocupam o cargo — derivado. */
  ocupantes: number
}

export interface Entregador {
  id: string
  valorDiaria: number
  taxaEntregaPercentual: number | null
  /** 0 = domingo … 6 = sábado. `null` quando não há dia fixo de folga. */
  folgaSemanal: number | null
}

export interface FuncionarioListItem {
  id: string
  nome: string
  /** Só os últimos dígitos; o CPF completo nunca sai de `queries.ts`. */
  cpfFinal: string | null
  cnpj: string | null
  cargoId: string
  cargoNome: string
  turno: TurnoTrabalho
  modeloContratual: ModeloContratual
  dataAdmissao: string
  dataDesligamento: string | null
  status: FuncionarioStatus
  motivoDesligamento: MotivoDesligamento | null
  /** Vigente hoje — derivado de `historico_salario`, nunca gravado. */
  salarioAtual: number | null
  entregador: Entregador | null
}

export interface RegistroSalario {
  id: string
  valor: number
  vigenteDesde: string
  motivo: MotivoSalario
  observacao: string | null
  responsavel: string | null
  criadoEm: string
}

export interface Ausencia {
  id: string
  funcionarioId: string
  funcionarioNome: string
  tipo: AusenciaTipo
  dataInicio: string
  dataFim: string
  /** Dias corridos cobertos, inclusive as duas pontas. */
  dias: number
  documentoAnexo: string | null
  observacao: string | null
  responsavel: string | null
}

export interface Beneficio {
  id: string
  tipo: BeneficioTipo
  valor: number
  recorrente: boolean
  ativo: boolean
  observacao: string | null
}

export interface FuncionarioDetalhe extends FuncionarioListItem {
  criadoEm: string
  salarios: RegistroSalario[]
  ausencias: Ausencia[]
  beneficios: Beneficio[]
}

/** Linha da prévia: ainda não existe no banco, é calculada na hora. */
export interface LinhaFolhaPrevia {
  funcionarioId: string
  funcionarioNome: string
  cargoNome: string
  tipo: FolhaItemTipo
  descricao: string
  valor: number
  /** Só em diária: quantas, e quanto vale cada uma. */
  quantidade: number | null
  valorUnitario: number | null
  /** Semanal no entregador, mensal no resto. */
  dataVencimento: string
}

export interface FolhaPrevia {
  competencia: string
  /** Vencimento dos mensalistas; a linha semanal traz o seu. */
  dataVencimento: string
  /** 0 = domingo … 6 = sábado. */
  diaPagamentoSemanal: number
  linhas: LinhaFolhaPrevia[]
  total: number
}

export interface LinhaFolha {
  id: string
  funcionarioId: string
  funcionarioNome: string
  tipo: FolhaItemTipo
  descricao: string
  valor: number
  dataVencimento: string
  /** Da conta a pagar que esta linha gerou. */
  contaPaga: boolean
}

export interface FolhaFechada {
  id: string
  competencia: string
  dataVencimento: string
  observacao: string | null
  responsavel: string | null
  criadoEm: string
  linhas: LinhaFolha[]
  total: number
  /** Bloqueia desfazer: dinheiro já saiu. */
  temContaPaga: boolean
}
