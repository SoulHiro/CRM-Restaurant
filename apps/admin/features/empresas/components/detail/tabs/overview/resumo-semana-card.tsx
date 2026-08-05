import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card'
import { StatCard } from '@repo/ui/components/stat-card'

import { formatCurrencyBRL, formatShortDateBR } from '@/lib/formatters'
import type { EmpresaPausa } from '../../../../lib/types'
import { TrendBadge } from '../../../shared/trend-badge'

export function ResumoSemanaCard({
  funcionariosAtivos,
  deltaFuncionarios,
  pedidosEnviados,
  deltaPedidos,
  taxaResposta,
  deltaTaxaResposta,
  ultimoFaturamento,
  proximaPausa,
}: {
  funcionariosAtivos: number
  deltaFuncionarios: number | null
  pedidosEnviados: number
  deltaPedidos: number | null
  taxaResposta: string
  deltaTaxaResposta: number | null
  ultimoFaturamento: number | undefined
  proximaPausa: EmpresaPausa | undefined
}) {
  return (
    <Card className="col-span-2 flex h-full flex-col overflow-hidden border-0">
      <CardHeader>
        <CardTitle className="text-base">Resumo da semana</CardTitle>
        <CardDescription>
          Visão geral rápida da operação com essa empresa
        </CardDescription>
      </CardHeader>
      <CardContent className="min-h-0 flex-1">
        <div className="grid h-full min-h-0 grid-cols-3 gap-4">
          <div className="grid h-full min-h-0 grid-rows-3 gap-3">
            <div className="flex min-h-0 gap-3">
              <StatCard
                className="min-h-0 flex-1 overflow-hidden"
                contentClassName="h-full justify-between gap-2 p-4"
                labelClassName="text-xs"
                label="Funcionários ativos"
                value={String(funcionariosAtivos)}
                trailing={<TrendBadge delta={deltaFuncionarios} />}
              />
              <StatCard
                className="min-h-0 flex-1 overflow-hidden"
                contentClassName="h-full justify-between gap-2 p-4"
                labelClassName="text-xs"
                label="Pedidos enviados"
                value={String(pedidosEnviados)}
                trailing={<TrendBadge delta={deltaPedidos} />}
              />
            </div>
            <StatCard
              className="row-span-2 min-h-0 overflow-hidden"
              contentClassName="h-full justify-between gap-2 p-4"
              labelClassName="text-xs"
              valueClassName="text-6xl truncate"
              label="Taxa de resposta"
              value={taxaResposta}
              trailing={<TrendBadge delta={deltaTaxaResposta} />}
            />
          </div>

          <div className="relative col-span-2 min-h-0 overflow-hidden rounded-lg bg-sidebar p-4 text-sidebar-foreground">
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <path
                d="M0,100 C25,85 15,65 35,55 C55,45 45,25 65,18 C80,12 88,6 100,0 L100,100 Z"
                fill="var(--sidebar-accent)"
                fillOpacity="0.5"
              />
            </svg>

            <div className="relative z-10 flex min-w-0 max-w-[70%] flex-col gap-1">
              <span className="text-xs text-sidebar-foreground/70">
                Faturamento do mês
              </span>
              <span className="truncate text-2xl font-bold">
                {ultimoFaturamento != null
                  ? formatCurrencyBRL(ultimoFaturamento)
                  : '—'}
              </span>
            </div>

            <div className="absolute bottom-0 right-0 z-10 rounded-tl-lg bg-card p-3 text-center text-card-foreground">
              <span className="text-[10px] text-muted-foreground">
                Próxima pausa
              </span>
              <p className="text-2xl font-bold">
                {proximaPausa ? formatShortDateBR(proximaPausa.data) : '—'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
