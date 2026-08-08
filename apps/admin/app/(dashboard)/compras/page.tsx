import { ComprasTabs } from '@/features/compras/components/compras-tabs'
import { parseCompraFiltro } from '@/features/compras/lib/compra-helpers'
import {
  getCompras,
  getFornecedores,
  getPrecosPorFornecedor,
  getSugestaoCompra,
} from '@/features/compras/lib/queries'
import { getEstoqueItensAtivos } from '@/features/estoque/lib/queries'
import { hojeISO } from '@/lib/formatters'

export default async function ComprasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const filtro = parseCompraFiltro(params.filtro)

  const [compras, sugestao, fornecedores, itens, precosPorFornecedor] =
    await Promise.all([
      getCompras(),
      getSugestaoCompra(),
      getFornecedores(),
      getEstoqueItensAtivos(),
      getPrecosPorFornecedor(),
    ])

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold">Compras</h1>
        <p className="text-sm text-muted-foreground">
          O que precisa repor, o que já foi pedido e quanto cada fornecedor cobra
          — sem lançar a mesma nota duas vezes.
        </p>
      </div>

      <ComprasTabs
        compras={compras}
        sugestao={sugestao}
        fornecedores={fornecedores}
        itens={itens}
        precosPorFornecedor={precosPorFornecedor}
        filtro={filtro}
        hoje={hojeISO()}
      />
    </div>
  )
}
