import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { Badge } from '@repo/ui/components/badge'
import { Button } from '@repo/ui/components/button'

import { CriarItemDrawer } from '@/features/catalogo/components/adicionais/criar-item-drawer'
import { ItensList } from '@/features/catalogo/components/adicionais/itens-list'
import { getGrupoAdicionalDetalhe } from '@/features/catalogo/lib/queries'

export default async function GrupoAdicionalPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const grupo = await getGrupoAdicionalDetalhe(id)

  if (!grupo) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <Button variant="ghost" size="icon" aria-label="Voltar" asChild>
        <Link href="/catalogo/adicionais">
          <ArrowLeft className="size-4" />
        </Link>
      </Button>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold">{grupo.nome}</h1>
          <div className="flex gap-1">
            {grupo.disponivelAlmoco && <Badge variant="outline">Almoço</Badge>}
            {grupo.disponivelJanta && <Badge variant="outline">Janta</Badge>}
          </div>
        </div>
        <CriarItemDrawer grupoId={grupo.id} />
      </div>

      <ItensList itens={grupo.itens} />
    </div>
  )
}
