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

export interface EmpresaDocumento {
  id: string
  nome: string
  tipo: 'contrato' | 'outro'
  arquivoUrl: string
  enviadoEm: string
}

export interface EmpresaPausa {
  id: string
  data: string
  motivo: string | null
}

export interface EmpresaFuncionarioPedido {
  dia: string
  diaSemanaLabel: string
  prato: string | null
  tamanho: 'P' | 'M' | 'G' | null
  status: 'pendente' | 'impresso' | 'erro_impressao' | null
  motivoErro: string | null
}

export interface EmpresaSemanaPedidos {
  semanaLabel: string
  inicioSemana: string
  pedidos: EmpresaFuncionarioPedido[]
}

export interface EmpresaFuncionario {
  id: string
  nome: string
  setor: string
  turno: string
  modalidade: string | null
  vinculoStatus: 'ativo' | 'inativo'
  respondeuEstaSemana: boolean
  pedidoHoje: EmpresaFuncionarioPedido | null
  pedidosSemana: EmpresaFuncionarioPedido[]
  historicoSemanas: EmpresaSemanaPedidos[]
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
  taxaResposta: number
}

export interface PedidoDoDiaItem {
  colaboradorId: string
  nome: string
  whatsapp: string | null
  turno: 'almoco' | 'jantar' | null
  tamanho: 'P' | 'M' | 'G' | null
  prato: string | null
  observacao: string | null
  /** ISO — quando o funcionário respondeu no formulário, não quando importamos. */
  respondidoEm: string | null
  recusou: boolean
}

export interface EmpresaDetail {
  status: EmpresaRecordStatus
  endereco: EmpresaEndereco
  contrato?: EmpresaContrato
  pausas: EmpresaPausa[]
  funcionarios: EmpresaFuncionario[]
  respostasSemanais: EmpresaRespostaSemanal[]
  satisfacao?: EmpresaSatisfacao
  faturamentoMensal: EmpresaFaturamentoMensal[]
  comparativoSemanaAnterior?: EmpresaComparativoSemanal
  documentos: EmpresaDocumento[]
}
