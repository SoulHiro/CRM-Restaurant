import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@repo/ui/components/tabs'

import { statusConta, type ContaFiltro } from '../lib/conta-helpers'
import type { FinanceiroPageData } from '../lib/queries'
import { ContasPagarTab } from './contas/contas-pagar-tab'
import { ContasReceberTab } from './contas/contas-receber-tab'
import { LancamentosTab } from './lancamentos/lancamentos-tab'
import { VisaoGeralTab } from './overview/visao-geral-tab'

function contarAtrasadas(
  contas: { status: 'pendente' | 'pago'; dataVencimento: string }[],
  hoje: string
): number {
  return contas.filter((c) => statusConta(c, hoje) === 'atrasado').length
}

export function FinanceiroTabs({
  dados,
  mes,
  filtro,
  hoje,
}: {
  dados: FinanceiroPageData
  mes: string
  filtro: ContaFiltro
  hoje: string
}) {
  const pagarAtrasadas = contarAtrasadas(dados.contasPagar, hoje)
  const receberAtrasadas = contarAtrasadas(dados.contasReceber, hoje)

  return (
    <Tabs defaultValue="visao-geral">
      <TabsList className="flex w-full justify-start bg-sidebar">
        <TabsTrigger value="visao-geral">Visão geral</TabsTrigger>
        <TabsTrigger value="lancamentos">
          Lançamentos
          {dados.transacoesDoMes.length > 0 && (
            <span className="ml-1.5 text-xs opacity-70">
              {dados.transacoesDoMes.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="a-pagar">
          A pagar
          {pagarAtrasadas > 0 && (
            <span className="ml-1.5 rounded-full bg-destructive px-1.5 text-xs font-semibold text-destructive-foreground">
              {pagarAtrasadas}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="a-receber">
          A receber
          {receberAtrasadas > 0 && (
            <span className="ml-1.5 rounded-full bg-destructive px-1.5 text-xs font-semibold text-destructive-foreground">
              {receberAtrasadas}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="visao-geral" className="mt-6">
        <VisaoGeralTab
          transacoesDoMes={dados.transacoesDoMes}
          contasPagar={dados.contasPagar}
          contasReceber={dados.contasReceber}
          meta={dados.meta}
          transacoesDaMeta={dados.transacoesDaMeta}
          ajustesMeta={dados.ajustesMeta}
          mes={mes}
          hoje={hoje}
        />
      </TabsContent>

      <TabsContent value="lancamentos" className="mt-6">
        <LancamentosTab
          transacoes={dados.transacoesDoMes}
          mes={mes}
          hoje={hoje}
        />
      </TabsContent>

      <TabsContent value="a-pagar" className="mt-6">
        <ContasPagarTab
          contas={dados.contasPagar}
          filtro={filtro}
          hoje={hoje}
        />
      </TabsContent>

      <TabsContent value="a-receber" className="mt-6">
        <ContasReceberTab
          contas={dados.contasReceber}
          filtro={filtro}
          mes={mes}
          hoje={hoje}
        />
      </TabsContent>
    </Tabs>
  )
}
