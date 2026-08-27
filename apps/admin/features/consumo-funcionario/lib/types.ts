export interface ConsumoPendenteItem {
  id: string
  produtoNome: string
  quantidade: number
  precoUnitario: number
  createdAt: string
}

export interface FuncionarioConsumo {
  id: string
  nome: string
  itensPendentes: ConsumoPendenteItem[]
  totalPendente: number
}

/** Produto elegível pra lançar como consumo — puxa preço direto do cardápio, nunca digitado. */
export interface ProdutoConsumivelOption {
  id: string
  nome: string
  categoriaId: string | null
  precoVenda: number
  fotoUrl: string | null
}
