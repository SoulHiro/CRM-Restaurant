export type EmpresaListStatus = 'aguardando' | 'finalizado'

export type EmpresaRecordStatus = 'ativo' | 'inativo'

export interface EmpresaListItem {
  id: string
  nome: string
  cnpj: string
  email: string
  responsavelNome: string
  responsavelTelefone: string
  cadastradaEm: string
  funcionariosRespondidos: number
  funcionariosTotal: number
  status: EmpresaListStatus
}

export interface EmpresaEndereco {
  cep: string
  logradouro: string
  numero: string
  complemento?: string
  bairro: string
  cidade: string
  uf: string
}

export interface EmpresaContrato {
  valor: number
  vigenciaInicio: string
  vigenciaFim: string
  prazoPagamento: string
  vigente: boolean
}

export interface EmpresaPausa {
  id: string
  data: string
  motivo: string | null
}

export interface EmpresaFuncionario {
  id: string
  nome: string
  setor: string
  turno: string
  modalidade: string | null
  vinculoStatus: 'ativo' | 'inativo'
  respondeuEstaSemana: boolean
}

export interface EmpresaEnvio {
  id: string
  data: string
  horario: string
  status: 'enviado' | 'confirmado' | 'erro'
  notaFiscalNumero: string | null
  notaFiscalEmitidaEm: string | null
  responsavel: string
  motivoErro: string | null
}

export interface EmpresaRespostaSemanal {
  dia: string
  responderam: number
  pendentes: number
}

export interface EmpresaSatisfacaoCategoria {
  categoria: string
  media: number
  delta?: number | null
}

export interface EmpresaSatisfacao {
  media: number
  totalAvaliacoes: number
  categoriasFuncionarios: EmpresaSatisfacaoCategoria[]
  categoriasEmpresa: EmpresaSatisfacaoCategoria[]
}

export interface EmpresaFaturamentoMensal {
  mes: string
  valor: number
}

export interface EmpresaComparativoSemanal {
  funcionariosAtivos: number
  pedidosEnviados: number
  taxaResposta: number
}

export interface EmpresaDetail {
  status: EmpresaRecordStatus
  endereco: EmpresaEndereco
  contrato?: EmpresaContrato
  pausas: EmpresaPausa[]
  funcionarios: EmpresaFuncionario[]
  envios: EmpresaEnvio[]
  respostasSemanais: EmpresaRespostaSemanal[]
  satisfacao?: EmpresaSatisfacao
  faturamentoMensal: EmpresaFaturamentoMensal[]
  comparativoSemanaAnterior?: EmpresaComparativoSemanal
}
