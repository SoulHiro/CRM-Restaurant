import Link from 'next/link'
import { Plus } from 'lucide-react'

import { Button } from '@repo/ui/components/button'

import { ProdutosTable } from '@/features/catalogo/components/list/produtos-table'
import { getProdutos } from '@/features/catalogo/lib/queries'

export default async function ProdutosPage() {
  const produtos = await getProdutos()

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Produtos</h1>
        <Button asChild size="sm">
          <Link href="/catalogo/produtos/novo">
            <Plus className="size-4" />
            Novo produto
          </Link>
        </Button>
      </div>

      <ProdutosTable
        produtos={produtos}
        vazioMensagem="Nenhum produto cadastrado ainda."
      />
    </div>
  )
}
