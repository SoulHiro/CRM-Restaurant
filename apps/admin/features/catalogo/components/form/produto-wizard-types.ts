import type { CriarProdutoInput } from '../../lib/types'

export type PassoProduto =
  | 'basico'
  | 'ficha-tecnica'
  | 'precificacao'
  | 'disponibilidade'
  | 'classificacoes'
  | 'revisao'

export const PASSOS_PRODUTO: { id: PassoProduto; label: string }[] = [
  { id: 'basico', label: 'Básico' },
  { id: 'ficha-tecnica', label: 'Ficha técnica' },
  { id: 'precificacao', label: 'Precificação' },
  { id: 'disponibilidade', label: 'Disponibilidade' },
  { id: 'classificacoes', label: 'Classificações' },
  { id: 'revisao', label: 'Revisão' },
]

export const PRODUTO_WIZARD_DEFAULTS: CriarProdutoInput = {
  nome: '',
  categoriaId: null,
  tipo: 'comida',
  descricao: '',
  fotoUrl: '',
  videoUrl: '',
  fichaTecnica: [],
  tempoMedioPreparoMinutos: 0,
  precoVenda: 0,
  descontoPercentual: null,
  disponivelDelivery: true,
  disponivelLocal: true,
  disponibilidadeStatus: 'disponivel',
  apareceAlmoco: true,
  apareceJanta: true,
  janelas: [],
  classificacaoIds: [],
  adicionalIds: [],
}
