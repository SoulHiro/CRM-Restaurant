import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@repo/ui/components/button'

import { IniciarInventarioDrawer } from '@/features/estoque/components/inventario/iniciar-inventario-drawer'
import { InventariosList } from '@/features/estoque/components/inventario/inventarios-list'
import {
  contarItensAtivos,
  getInventarios,
} from '@/features/estoque/lib/queries'
import { hojeISO } from '@/lib/formatters'

export default async function InventarioPage() {
  const [inventarios, itensAtivos] = await Promise.all([
    getInventarios(),
    contarItensAtivos(),
  ])

  const emAndamento = inventarios.find(
    (inventario) => inventario.status === 'em_andamento'
  )

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <Button variant="ghost" size="icon" aria-label="Voltar" asChild>
        <Link href="/estoque">
          <ArrowLeft className="size-4" />
        </Link>
      </Button>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Inventário físico</h1>
          <p className="text-sm text-muted-foreground">
            A contagem na mão conferida contra o que o sistema calculou. É onde
            erro de baixa, quebra não anotada e furto aparecem.
          </p>
        </div>

        <IniciarInventarioDrawer
          hoje={hojeISO()}
          itensAtivos={itensAtivos}
          disabled={emAndamento != null || itensAtivos === 0}
        />
      </div>

      {emAndamento && (
        <p className="text-sm text-muted-foreground">
          Existe uma contagem em andamento —{' '}
          <Link
            href={`/estoque/inventario/${emAndamento.id}`}
            className="font-medium text-foreground underline underline-offset-4"
          >
            continue por ela
          </Link>{' '}
          antes de abrir outra.
        </p>
      )}

      {itensAtivos === 0 && (
        <p className="text-sm text-muted-foreground">
          Cadastre pelo menos um item de estoque antes de abrir uma contagem.
        </p>
      )}

      <InventariosList inventarios={inventarios} />
    </div>
  )
}
