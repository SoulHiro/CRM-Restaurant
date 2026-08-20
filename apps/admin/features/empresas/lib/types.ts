export type EmpresaListStatus = 'aguardando' | 'finalizado'

export type EmpresaRecordStatus = 'ativo' | 'inativo'

/**
 * 'pesagem': parte dos pedidos do dia é preparada em lote (arroz/feijão por
 * headcount, resto contado por prato) em vez de virar comanda individual —
 * ver features/empresas/lib/pesagem-helpers.ts. Hoje só a NOVAPRINT2 usa.
 */
export type EmpresaFluxoPedido = 'padrao' | 'pesagem'

/** 'unico': sem distinção de tamanho — todo mundo paga o mesmo valor (ex: COFEL). */
export type EmpresaPrecoModo = 'por_tamanho' | 'unico'

export type TurnoRefeicao =
  | 'almoco'
  | 'jantar'
  | '1_turno'
  | '2_turno'
  | '3_turno'
  | 'administrativo'

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
  endereco: EmpresaEndereco
  fluxoPedido: EmpresaFluxoPedido
  /** P/M/G/Lanche/Café/Suco no resumo do dia — independente de fluxoPedido. */
  resumoMostraQuantidades: boolean
  precoModo: EmpresaPrecoModo
  pedeCafe: boolean
  pedeLanche: boolean
  pedeSuco: boolean
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

/**
 * "Funcionário" real — `colaborador_pedido`, sem CPF/setor/turno formais
 * (a planilha não fornece). Distinto de `EmpresaFuncionario` (mock, domínio
 * estruturado que ainda não existe de verdade).
 */
export interface ColaboradorEmpresaItem {
  id: string
  nome: string
  whatsapp: string | null
  ativo: boolean
  totalPedidos: number
  /** ISO (dia de calendário) da última vez que fez um pedido, se houver. */
  ultimoPedidoEm: string | null
  /** "Marmita separada" — só relevante em empresas com fluxo_pedido='pesagem'. */
  separado: boolean
}

export interface EmpresaRespostaSemanal {
  dia: string
  responderam: number
  pendentes: number
}

/**
 * Visão geral operacional real — derivada de `colaborador_pedido`/
 * `pedido_dia_importado`, últimos 7 dias. Sem `funcionariosAtivos` da
 * semana passada pra comparar (não existe histórico de quem estava ativo
 * quando), só a taxa de resposta tem comparativo real.
 */
export interface VisaoGeralOperacional {
  funcionariosAtivos: number
  respostasSemanais: EmpresaRespostaSemanal[]
  naoResponderam: { id: string; nome: string }[]
  taxaRespostaNumero: number | null
  deltaTaxaResposta: number | null
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
  tipo: 'marmita' | 'lanche'
  turno: TurnoRefeicao | null
  tamanho: 'P' | 'M' | 'G' | null
  prato: string | null
  /** Só lanche — preço travado no momento em que foi lançado. */
  preco: number | null
  observacao: string | null
  /** ISO — quando o funcionário respondeu no formulário, não quando importamos. */
  respondidoEm: string | null
  recusou: boolean
  /** ISO — quando essa linha entrou/foi atualizada (reimportação inclusa). */
  importadoEm: string
  /** ISO — última vez que saiu impresso; nulo = nunca imprimiu. */
  impressoEm: string | null
}

export interface ContagemTamanhos {
  p: number
  m: number
  g: number
  lanche: number
}

export interface ItemFechamento {
  colaboradorNome: string
  tipo: 'marmita' | 'lanche'
  prato: string | null
  tamanho: 'P' | 'M' | 'G' | null
  preco: number
}

export interface FechamentoDia {
  data: string
  quantidadeP: number
  precoUnitarioP: number
  quantidadeM: number
  precoUnitarioM: number
  quantidadeG: number
  precoUnitarioG: number
  quantidadeCafe: number
  precoUnitarioCafe: number
  quantidadeSuco: number
  precoUnitarioSuco: number
  quantidadeLanche: number
  /** Só preenchido quando a empresa usa precoModo = 'unico' (ex: COFEL). */
  quantidadeMarmitaUnica: number
  precoUnitarioMarmitaUnica: number
  valorTotal: number
  finalizadoPor: string | null
  finalizadoEm: string
  itens: ItemFechamento[]
}

export type PrecoPadraoTipo =
  | 'marmita_p'
  | 'marmita_m'
  | 'marmita_g'
  | 'marmita_unica'
  | 'cafe'
  | 'suco'
  | 'lanche'
  | 'garrafa_cafe_adicional'

export interface PrecoPadraoItem {
  nome: string
  preco: number
}

export type PrecosPadraoEmpresa = Record<PrecoPadraoTipo, PrecoPadraoItem>

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
