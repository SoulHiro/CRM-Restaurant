import Link from 'next/link'
import { ClipboardList } from 'lucide-react'

import { Button } from '@repo/ui/components/button'

import { AlertasEstoquePanel } from '@/features/estoque/components/alertas/alertas-estoque-panel'
import { EstoquePagination } from '@/features/estoque/components/list/estoque-pagination'
import { EstoqueTable } from '@/features/estoque/components/list/estoque-table'
import { EstoqueToolbar } from '@/features/estoque/components/list/estoque-toolbar'
import {
  filterEstoque,
  parseEstoqueFilters,
  selecionarAlertas,
} from '@/features/estoque/lib/estoque-helpers'
import { getEstoqueItens } from '@/features/estoque/lib/queries'
import { hojeISO } from '@/lib/formatters'

export default async function EstoquePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const itens = await getEstoqueItens()

  const hoje = hojeISO()
  const filters = parseEstoqueFilters(params)
  const resultado = filterEstoque(itens, filters, hoje)
  const alertas = selecionarAlertas(itens, hoje)

  const semNenhumItem = itens.length === 0

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Estoque</h1>
          <p className="text-sm text-muted-foreground">
            O que tem na despensa, o que está acabando e o que está perto de
            vencer.
          </p>
        </div>

        <Button variant="outline" size="sm" className="w-full sm:w-auto" asChild>
          <Link href="/estoque/inventario">
            <ClipboardList className="size-4" />
            Inventário
          </Link>
        </Button>
      </div>

      {!semNenhumItem && <AlertasEstoquePanel alertas={alertas} />}

      <EstoqueToolbar
        filters={filters}
        unidadesDisponiveis={resultado.unidadesDisponiveis}
      />

      <EstoqueTable
        itens={resultado.items}
        hoje={hoje}
        vazioMensagem={
          semNenhumItem
            ? 'Nenhum item cadastrado ainda. Comece pelo que falta com mais frequência.'
            : 'Nenhum item bate com esses filtros.'
        }
      />

      <EstoquePagination
        page={resultado.page}
        pageSize={resultado.pageSize}
        total={resultado.total}
        totalPages={resultado.totalPages}
      />
    </div>
  )
}
