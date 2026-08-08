import { FinanceiroTabs } from '@/features/financeiro/components/financeiro-tabs'
import { parseContaFiltro } from '@/features/financeiro/lib/conta-helpers'
import { mesDe } from '@/features/financeiro/lib/dre-helpers'
import { getFinanceiroPageData } from '@/features/financeiro/lib/queries'
import { hojeISO } from '@/lib/formatters'

function parseMes(valor: string | string[] | undefined, padrao: string): string {
  return typeof valor === 'string' && /^\d{4}-\d{2}$/.test(valor)
    ? valor
    : padrao
}

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const hoje = hojeISO()
  const mes = parseMes(params.mes, mesDe(hoje))
  const filtro = parseContaFiltro(params.filtro)

  const dados = await getFinanceiroPageData(mes)

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold">Financeiro</h1>
        <p className="text-sm text-muted-foreground">
          Quanto entrou, quanto saiu, o que ainda está em aberto e o quanto
          falta para a meta.
        </p>
      </div>

      <FinanceiroTabs dados={dados} mes={mes} filtro={filtro} hoje={hoje} />
    </div>
  )
}
