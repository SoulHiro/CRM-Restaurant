'use client'

import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@repo/ui/components/chart'

import type { getEnviosPorDia } from '../../../../lib/overview-helpers'

const enviosConfig = {
  total: { label: 'Pedidos enviados', color: 'var(--primary)' },
} satisfies ChartConfig

export function PedidosEnviadosChart({
  data,
}: {
  data: ReturnType<typeof getEnviosPorDia>
}) {
  return (
    <ChartContainer config={enviosConfig} className="h-[240px] w-full">
      <AreaChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="data"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value: string) =>
            new Date(value).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
            })
          }
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          dataKey="total"
          type="monotone"
          fill="var(--color-total)"
          fillOpacity={0.2}
          stroke="var(--color-total)"
        />
      </AreaChart>
    </ChartContainer>
  )
}
