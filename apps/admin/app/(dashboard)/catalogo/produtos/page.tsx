import Link from 'next/link'
import { Plus } from 'lucide-react'

import { Button } from '@repo/ui/components/button'

import { ProdutosTable } from '@/features/catalogo/components/list/produtos-table'
import { ProdutosToolbar } from '@/features/catalogo/components/list/produtos-toolbar'
import { filterProdutos, parseProdutoFilters } from '@/features/catalogo/lib/produto-helpers'
import { getCategoriasProduto, getProdutos } from '@/features/catalogo/lib/queries'

export default async function ProdutosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const [params, produtos, categorias] = await Promise.all([
    searchParams,
    getProdutos(),
    getCategoriasProduto(),
  ])

  const filters = parseProdutoFilters(params)
  const produtosFiltrados = filterProdutos(produtos, filters)
  const semNenhumProduto = produtos.length === 0

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Produtos</h1>
          <p className="text-sm text-muted-foreground">
            Cardápio de almoço e de janta, local e delivery, tudo num lugar
            só.
          </p>
        </div>
        <Button asChild size="sm" className="w-full sm:w-auto">
          <Link href="/catalogo/produtos/novo">
            <Plus className="size-4" />
            Novo produto
          </Link>
        </Button>
      </div>

      {!semNenhumProduto && <ProdutosToolbar categorias={categorias} />}

      <ProdutosTable
        produtos={produtosFiltrados}
        vazioMensagem={
          semNenhumProduto
            ? 'Nenhum produto cadastrado ainda.'
            : 'Nenhum produto bate com esses filtros.'
        }
      />
    </div>
  )
}
