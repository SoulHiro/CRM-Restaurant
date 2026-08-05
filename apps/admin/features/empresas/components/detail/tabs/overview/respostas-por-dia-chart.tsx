'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@repo/ui/components/chart'

import type { EmpresaRespostaSemanal } from '../../../../lib/types'

const respostasConfig = {
  responderam: { label: 'Responderam', color: 'var(--sidebar)' },
  pendentes: { label: 'Pendentes', color: 'var(--primary)' },
} satisfies ChartConfig

export function RespostasPorDiaChart({
  data,
}: {
  data: EmpresaRespostaSemanal[]
}) {
  return (
    <ChartContainer config={respostasConfig} className="h-[240px] w-full">
      <BarChart data={data} barCategoryGap="35%" barSize={32}>
        <defs>
          <pattern
            id="hachuraPendentes"
            patternUnits="userSpaceOnUse"
            width="4"
            height="4"
            patternTransform="rotate(45)"
          >
            <rect width="4" height="4" fill="var(--accent)" />
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="4"
              stroke="var(--color-pendentes)"
              strokeWidth="2.5"
            />
          </pattern>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="dia" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} width={24} />
        <ChartTooltip
          cursor={{
            fill: 'var(--sidebar-accent)',
            fillOpacity: 0.35,
            radius: 4,
          }}
          content={<ChartTooltipContent />}
        />
        <Bar
          dataKey="responderam"
          stackId="respostas"
          fill="var(--color-responderam)"
          radius={4}
          barSize={32}
          stroke="var(--muted)"
          strokeWidth={4}
          className="cursor-pointer"
        />
        <Bar
          dataKey="pendentes"
          stackId="respostas"
          fill="url(#hachuraPendentes)"
          radius={4}
          barSize={32}
          stroke="var(--muted)"
          strokeWidth={4}
          className="cursor-pointer"
        />
      </BarChart>
    </ChartContainer>
  )
}
