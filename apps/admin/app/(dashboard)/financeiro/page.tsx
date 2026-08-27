import { FinanceiroTabs } from '@/features/financeiro/components/financeiro-tabs'
import { parseContaFiltro } from '@/features/financeiro/lib/conta-helpers'
import { mesDe } from '@/features/financeiro/lib/dre-helpers'
import {
  jornadaDe,
  normalizarJornadaInicio,
} from '@/features/financeiro/lib/jornada-helpers'
import { getFinanceiroPageData } from '@/features/financeiro/lib/queries'
import {
  quinzenaAnterior,
  quinzenaAtual,
  quinzenaDeChave,
  quinzenaParaChave,
} from '@/features/financeiro/lib/quinzena-helpers'
import {
  getFaturamentoDiarioNoPeriodo,
  getFaturamentoPorEmpresaNoPeriodo,
} from '@/features/empresas/lib/queries'
import { hojeISO } from '@/lib/formatters'

const QUINZENAS_HISTORICO = 6

function parseMes(valor: string | string[] | undefined, padrao: string): string {
  return typeof valor === 'string' && /^\d{4}-\d{2}$/.test(valor)
    ? valor
    : padrao
}

function parseJornadaInicio(
  valor: string | string[] | undefined,
  padrao: string
): string {
  return typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor)
    ? normalizarJornadaInicio(valor)
    : padrao
}

function parseQuinzenaChave(
  valor: string | string[] | undefined,
  padrao: string
): string {
  if (typeof valor !== 'string') return padrao
  return quinzenaDeChave(valor) ? valor : padrao
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
  const jornadaInicio = parseJornadaInicio(
    params.jornada,
    jornadaDe(hoje).inicio
  )
  const quinzenaChave = parseQuinzenaChave(
    params.quinzena,
    quinzenaParaChave(quinzenaAtual(hoje))
  )
  const quinzena = quinzenaDeChave(quinzenaChave) ?? quinzenaAtual(hoje)

  let quinzenaHistoricoInicio = quinzena
  for (let i = 0; i < QUINZENAS_HISTORICO - 1; i++) {
    quinzenaHistoricoInicio = quinzenaAnterior(quinzenaHistoricoInicio)
  }

  const [dados, faturamentoPorEmpresa, faturamentoDiario] = await Promise.all([
    getFinanceiroPageData(mes),
    getFaturamentoPorEmpresaNoPeriodo(quinzena.inicio, quinzena.fim),
    getFaturamentoDiarioNoPeriodo(quinzenaHistoricoInicio.inicio, quinzena.fim),
  ])

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold">Financeiro</h1>
        <p className="text-sm text-muted-foreground">
          Quanto entrou, quanto saiu, o que ainda está em aberto e o quanto
          falta para a meta.
        </p>
      </div>

      <FinanceiroTabs
        dados={dados}
        mes={mes}
        filtro={filtro}
        jornadaInicio={jornadaInicio}
        quinzena={quinzena}
        faturamentoPorEmpresa={faturamentoPorEmpresa}
        faturamentoDiario={faturamentoDiario}
        hoje={hoje}
      />
    </div>
  )
}
