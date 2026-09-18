import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@repo/ui/components/button'

import { ContagemDoDiaPanel } from '@/features/estoque/components/inventario/contagem-do-dia-panel'
import { InventariosList } from '@/features/estoque/components/inventario/inventarios-list'
import {
  contarItensAtivos,
  getContagensHoje,
  getInventarios,
} from '@/features/estoque/lib/queries'
import { getActiveOrganizationId } from '@/lib/get-active-organization-id'

export default async function InventarioPage() {
  const organizationId = await getActiveOrganizationId()
  if (!organizationId) notFound()

  const [contagensHoje, itensAtivos, inventarios] = await Promise.all([
    getContagensHoje(organizationId),
    contarItensAtivos(organizationId),
    getInventarios(organizationId),
  ])

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <Button variant="ghost" size="icon" aria-label="Voltar" asChild>
        <Link href="/estoque">
          <ArrowLeft className="size-4" />
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-semibold">Contagem de estoque</h1>
        <p className="text-sm text-muted-foreground">
          Confira o que tem na prateleira contra o que o sistema calculou —
          uma vez na abertura, outra no fechamento.
        </p>
      </div>

      <ContagemDoDiaPanel
        abertura={contagensHoje.abertura}
        fechamento={contagensHoje.fechamento}
        itensAtivos={itensAtivos}
      />

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">
          Histórico
        </h2>
        <InventariosList inventarios={inventarios} />
      </div>
    </div>
  )
}
