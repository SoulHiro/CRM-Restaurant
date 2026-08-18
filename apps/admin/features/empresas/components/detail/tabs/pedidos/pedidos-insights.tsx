'use client'

import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@repo/ui/components/chart'
import { EmptyState } from '@repo/ui/components/empty-state'
import { StatCard } from '@repo/ui/components/stat-card'

import type { PedidoDoDiaItem } from '../../../../lib/types'

const pratosConfig = {
  quantidade: { label: 'Pedidos', color: 'var(--sidebar)' },
} satisfies ChartConfig

function truncar(texto: string, tamanho: number): string {
  return texto.length > tamanho ? `${texto.slice(0, tamanho - 1)}…` : texto
}

export function PedidosInsights({ pedidos }: { pedidos: PedidoDoDiaItem[] }) {
  const contagem = useMemo(() => {
    let p = 0
    let m = 0
    let g = 0
    let lanche = 0
    for (const pedido of pedidos) {
      if (pedido.recusou) continue
      if (pedido.tipo === 'lanche') lanche++
      else if (pedido.tamanho === 'P') p++
      else if (pedido.tamanho === 'M') m++
      else if (pedido.tamanho === 'G') g++
    }
    return { p, m, g, lanche }
  }, [pedidos])

  const pratosMaisPedidos = useMemo(() => {
    const contagemPorPrato = new Map<string, number>()
    for (const pedido of pedidos) {
      if (pedido.tipo !== 'marmita' || pedido.recusou || !pedido.prato) continue
      contagemPorPrato.set(
        pedido.prato,
        (contagemPorPrato.get(pedido.prato) ?? 0) + 1
      )
    }
    return Array.from(contagemPorPrato, ([prato, quantidade]) => ({
      prato: truncar(prato, 22),
      quantidade,
    }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 8)
  }, [pedidos])

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Marmita P" value={String(contagem.p)} />
        <StatCard label="Marmita M" value={String(contagem.m)} />
        <StatCard label="Marmita G" value={String(contagem.g)} />
        <StatCard label="Lanche" value={String(contagem.lanche)} />
      </div>

      <Card className="border-0">
        <CardHeader>
          <CardTitle className="text-base">Pratos mais pedidos</CardTitle>
        </CardHeader>
        <CardContent>
          {pratosMaisPedidos.length === 0 ? (
            <EmptyState message="Nenhum prato pra mostrar ainda." />
          ) : (
            <ChartContainer
              config={pratosConfig}
              className="h-[260px] w-full"
            >
              <BarChart
                data={pratosMaisPedidos}
                layout="vertical"
                margin={{ left: 8 }}
              >
                <CartesianGrid horizontal={false} />
                <XAxis type="number" allowDecimals={false} hide />
                <YAxis
                  type="category"
                  dataKey="prato"
                  tickLine={false}
                  axisLine={false}
                  width={120}
                  fontSize={11}
                />
                <ChartTooltip
                  cursor={{ fill: 'var(--sidebar-accent)', fillOpacity: 0.35 }}
                  content={<ChartTooltipContent />}
                />
                <Bar
                  dataKey="quantidade"
                  fill="var(--color-quantidade)"
                  radius={4}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
