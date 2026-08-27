'use client'

import type { ReactNode } from 'react'
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@repo/ui/components/chart'
import { TrendBadge } from '@repo/ui/components/trend-badge'

import { formatCurrencyBRL } from '@/lib/formatters'
import type { ResumoPeriodo } from '../../lib/resumo-periodo-helpers'

const chartConfig = {
  total: { label: 'Total', color: 'var(--primary)' },
} satisfies ChartConfig

export function ResumoPeriodoSidebar({
  titulo,
  legendaPeriodo,
  icon,
  resumo,
  invertido,
  breakdown,
  breakdownLabel = 'Por categoria neste período',
}: {
  titulo: string
  /** "nesta jornada" / "nesta quinzena" — completa "Total ___" e "R$X ___ passada". */
  legendaPeriodo: string
  /** Elemento já renderizado (ex: `<Wallet className="size-4" />`) — um
   * componente de ícone não pode atravessar a fronteira server/client como
   * referência, só como elemento. */
  icon: ReactNode
  resumo: ResumoPeriodo
  /** true pra despesas — subir é ruim, não bom. */
  invertido?: boolean
  breakdown?: { label: string; valor: number }[]
  breakdownLabel?: string
}) {
  const maiorBreakdown = breakdown
    ? Math.max(...breakdown.map((b) => b.valor), 1)
    : 1

  return (
    <Card className="border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {titulo}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">
            Total {legendaPeriodo}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tabular-nums">
              {formatCurrencyBRL(resumo.atual)}
            </span>
            <TrendBadge delta={resumo.variacao} invertido={invertido} />
          </div>
          <span className="text-xs text-muted-foreground">
            {formatCurrencyBRL(resumo.anterior)} {legendaPeriodo.replace('nesta', 'na')} passada
          </span>
        </div>

        <ChartContainer config={chartConfig} className="h-[140px] w-full">
          <AreaChart data={resumo.historico} margin={{ left: 0, right: 0 }}>
            <defs>
              <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-total)"
                  stopOpacity={0.35}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-total)"
                  stopOpacity={0.02}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={11}
            />
            <ChartTooltip
              content={<ChartTooltipContent hideLabel={false} />}
            />
            <Area
              dataKey="total"
              type="monotone"
              fill="url(#fillTotal)"
              stroke="var(--color-total)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>

        {breakdown && breakdown.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-xs text-muted-foreground">
              {breakdownLabel}
            </span>
            {breakdown.map((item) => (
              <div key={item.label} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{item.label}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {formatCurrencyBRL(item.valor)}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${(item.valor / maiorBreakdown) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
