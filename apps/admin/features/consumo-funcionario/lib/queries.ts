import 'server-only'

import { db } from '@/lib/db'
import { toNumber } from '@/lib/numeric'
import {
  getCategoriasProduto,
  getProdutos,
} from '@/features/catalogo/lib/queries'
import { getFuncionarios } from '@/features/rh/lib/queries'

import type {
  ConsumoPendenteItem,
  FuncionarioConsumo,
  ProdutoConsumivelOption,
} from './types'

export { getCategoriasProduto }

/** Produtos ativos do cardápio, com o preço já resolvido (o menor tamanho, se tiver). */
export async function getProdutosConsumiveis(
  organizationId: string
): Promise<ProdutoConsumivelOption[]> {
  const produtos = await getProdutos(organizationId)
  return produtos
    .filter((produto) => produto.ativo)
    .map((produto) => ({
      id: produto.id,
      nome: produto.nome,
      categoriaId: produto.categoriaId,
      precoVenda: produto.temTamanhos
        ? (produto.precoMinimo ?? 0)
        : (produto.precoVenda ?? 0),
      fotoUrl: produto.fotoUrl,
    }))
}

async function getConsumosPendentesPorFuncionario(): Promise<
  Map<string, ConsumoPendenteItem[]>
> {
  const rows = await db.query.consumo_funcionario.findMany({
    where: (c, { eq }) => eq(c.status, 'pendente'),
    with: { produto: { columns: { nome: true } } },
    orderBy: (c, { desc }) => [desc(c.created_at)],
  })

  const porFuncionario = new Map<string, ConsumoPendenteItem[]>()
  for (const row of rows) {
    const item: ConsumoPendenteItem = {
      id: row.id,
      produtoNome: row.produto.nome,
      quantidade: row.quantidade,
      precoUnitario: toNumber(row.preco_unitario),
      createdAt: row.created_at.toISOString(),
    }
    const lista = porFuncionario.get(row.funcionario_interno_id) ?? []
    lista.push(item)
    porFuncionario.set(row.funcionario_interno_id, lista)
  }
  return porFuncionario
}

/** Funcionários ativos com o que cada um tem pendente pra quitar. */
export async function getFuncionariosComConsumo(): Promise<
  FuncionarioConsumo[]
> {
  const [funcionarios, porFuncionario] = await Promise.all([
    getFuncionarios(),
    getConsumosPendentesPorFuncionario(),
  ])

  return funcionarios
    .filter((f) => f.status === 'ativo')
    .map((f) => {
      const itensPendentes = porFuncionario.get(f.id) ?? []
      return {
        id: f.id,
        nome: f.nome,
        itensPendentes,
        totalPendente: itensPendentes.reduce(
          (soma, item) => soma + item.quantidade * item.precoUnitario,
          0
        ),
      }
    })
}
