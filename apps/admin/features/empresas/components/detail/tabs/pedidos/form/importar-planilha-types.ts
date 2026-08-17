import type {
  LinhaBruta,
  MapeamentoColunas,
  PedidoDiaBruto,
  SugestaoCorrespondencia,
} from '../../../../../lib/importacao-helpers'

export type PassoImportacao = 'upload' | 'mapear' | 'revisar' | 'confirmar'

export interface PlanilhaLida {
  arquivoNome: string
  cabecalho: LinhaBruta
  linhas: LinhaBruta[]
}

export interface PessoaRevisao {
  nome: string
  whatsapp: string | null
  /** null = cria colaborador novo; preenchido = vincula a um já existente. */
  colaboradorId: string | null
  sugestao: SugestaoCorrespondencia | null
  dias: PedidoDiaBruto[]
}

export interface ColaboradorExistenteOption {
  id: string
  nome: string
}

export interface ResultadoImportacao {
  colaboradoresNovos: number
  diasImportados: number
}

export const PASSOS: { id: PassoImportacao; label: string }[] = [
  { id: 'upload', label: 'Upload' },
  { id: 'mapear', label: 'Mapear colunas' },
  { id: 'revisar', label: 'Revisar pessoas' },
  { id: 'confirmar', label: 'Confirmar' },
]

export type { LinhaBruta, MapeamentoColunas, PedidoDiaBruto }
