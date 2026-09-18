import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@repo/ui/components/button'

import { ProdutoForm } from '@/features/catalogo/components/form/produto-form'
import {
  getCategoriasProduto,
  getInsumosDisponiveis,
  getProdutoDetalhe,
} from '@/features/catalogo/lib/queries'
import { getConfiguracaoPrecificacao } from '@/features/configuracoes/lib/queries'
import { getActiveOrganizationId } from '@/lib/get-active-organization-id'

export default async function EditarProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const organizationId = await getActiveOrganizationId()
  if (!organizationId) notFound()

  const [categorias, insumos, configuracaoPrecificacao, produto] =
    await Promise.all([
      getCategoriasProduto(organizationId),
      getInsumosDisponiveis(organizationId),
      getConfiguracaoPrecificacao(organizationId),
      getProdutoDetalhe(organizationId, id),
    ])

  if (!produto) notFound()

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <Button variant="ghost" size="icon" aria-label="Voltar" asChild>
        <Link href="/catalogo/produtos">
          <ArrowLeft className="size-4" />
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-semibold">Editar produto</h1>
        <p className="text-sm text-muted-foreground">
          {produto.nome} — altere o que for necessário e salve.
        </p>
      </div>

      <ProdutoForm
        categorias={categorias}
        insumos={insumos}
        configuracaoPrecificacao={configuracaoPrecificacao}
        produtoId={produto.id}
        dadosIniciais={produto}
      />
    </div>
  )
}
