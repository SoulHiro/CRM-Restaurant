'use client'

import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@repo/ui/components/chart'

import type { EmpresaFaturamentoMensal } from '../../lib/types'

const faturamentoConfig = {
  valor: { label: 'Faturamento', color: 'var(--primary)' },
} satisfies ChartConfig

export function FaturamentoBarChart({
  data,
  className = 'h-[240px] w-full',
}: {
  data: EmpresaFaturamentoMensal[]
  className?: string
}) {
  return (
    <ChartContainer config={faturamentoConfig} className={className}>
      <BarChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="mes" tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="valor" fill="var(--color-valor)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
