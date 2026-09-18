import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@repo/ui/components/button'

import { notFound } from 'next/navigation'

import { ProdutoForm } from '@/features/catalogo/components/form/produto-form'
import {
  getCategoriasProduto,
  getInsumosDisponiveis,
} from '@/features/catalogo/lib/queries'
import { getConfiguracaoPrecificacao } from '@/features/configuracoes/lib/queries'
import { getActiveOrganizationId } from '@/lib/get-active-organization-id'

export default async function NovoProdutoPage() {
  const organizationId = await getActiveOrganizationId()
  if (!organizationId) notFound()

  const [categorias, insumos, configuracaoPrecificacao] = await Promise.all([
    getCategoriasProduto(organizationId),
    getInsumosDisponiveis(organizationId),
    getConfiguracaoPrecificacao(organizationId),
  ])

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <Button variant="ghost" size="icon" aria-label="Voltar" asChild>
        <Link href="/catalogo/produtos">
          <ArrowLeft className="size-4" />
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-semibold">Novo produto</h1>
        <p className="text-sm text-muted-foreground">
          Preencha o que for necessário — o resumo ao lado já mostra preço e
          margem em tempo real.
        </p>
      </div>

      <ProdutoForm
        categorias={categorias}
        insumos={insumos}
        configuracaoPrecificacao={configuracaoPrecificacao}
      />
    </div>
  )
}
