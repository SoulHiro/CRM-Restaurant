'use client'

import { useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Building2,
  Clock,
  Flame,
  Package,
  Scale,
  Shuffle,
  Smile,
  Sparkles,
  Thermometer,
  User,
  Utensils,
  type LucideIcon,
} from 'lucide-react'

import { Button } from '@repo/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card'
import { EmptyState } from '@repo/ui/components/empty-state'
import { cn } from '@repo/ui/lib/utils'

import type {
  EmpresaSatisfacao,
  EmpresaSatisfacaoCategoria,
} from '../../../../lib/types'

const CATEGORIA_ICON: Record<string, LucideIcon> = {
  Sabor: Utensils,
  Temperos: Flame,
  Variedade: Shuffle,
  Quantidade: Scale,
  Temperatura: Thermometer,
  Pontualidade: Clock,
  Embalagem: Package,
  Atendimento: Smile,
}

function getStatusLabel(media: number): string {
  if (media >= 4.5) return 'Excelente'
  if (media >= 4) return 'Bom'
  if (media >= 3) return 'Regular'
  return 'Precisa de atenção'
}

function mediaDe(categorias: EmpresaSatisfacaoCategoria[]): number {
  if (categorias.length === 0) return 0
  return categorias.reduce((soma, c) => soma + c.media, 0) / categorias.length
}

function deltaMedioDe(categorias: EmpresaSatisfacaoCategoria[]): number | null {
  const deltas = categorias
    .map((c) => c.delta)
    .filter((delta): delta is number => delta != null)
  if (deltas.length === 0) return null
  return deltas.reduce((soma, delta) => soma + delta, 0) / deltas.length
}

function splitCategorias(categorias: EmpresaSatisfacaoCategoria[]) {
  const ordenadas = [...categorias].sort((a, b) => b.media - a.media)
  const corte = Math.ceil(ordenadas.length / 2)
  return { fortes: ordenadas.slice(0, corte), atencao: ordenadas.slice(corte) }
}

function DeltaLabel({ delta }: { delta: number | null | undefined }) {
  if (delta == null) return null
  const isPositive = delta >= 0
  if (delta === 0) {
    return <span className="text-xs font-medium text-muted-foreground">—</span>
  }
  const Icon = isPositive ? ArrowUp : ArrowDown
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-medium',
        isPositive
          ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-red-600 dark:text-red-400'
      )}
    >
      <Icon className="size-3" />
      {Math.abs(delta).toFixed(1)} pt
    </span>
  )
}

function ScoreRing({ media, color }: { media: number; color: string }) {
  const radius = 32
  const circumference = 2 * Math.PI * radius
  const proporcao = Math.max(0, Math.min(1, media / 5))
  const offset = circumference * (1 - proporcao)

  return (
    <div className="relative flex size-20 shrink-0 items-center justify-center">
      <svg
        width="80"
        height="80"
        viewBox="0 0 80 80"
        className="absolute inset-0 -rotate-90"
      >
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth="7"
        />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="text-xl font-bold">{media.toFixed(1)}</span>
    </div>
  )
}

function CategoriaRow({
  categoria,
  accentColor,
}: {
  categoria: EmpresaSatisfacaoCategoria
  accentColor: string
}) {
  const Icon = CATEGORIA_ICON[categoria.categoria] ?? Sparkles

  return (
    <div className="flex items-center gap-2">
      <span
        className="flex size-7 shrink-0 items-center justify-center rounded-full"
        style={{
          backgroundColor: `color-mix(in oklch, ${accentColor} 18%, transparent)`,
          color: accentColor,
        }}
      >
        <Icon className="size-3.5" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[11px] text-muted-foreground">
          {categoria.categoria}
        </span>
        <span className="flex items-center gap-1.5 text-sm font-semibold">
          {categoria.media.toFixed(1)}
          <DeltaLabel delta={categoria.delta} />
        </span>
      </div>
    </div>
  )
}

export function SatisfacaoCard({
  satisfacao,
}: {
  satisfacao?: EmpresaSatisfacao
}) {
  const [visao, setVisao] = useState<'funcionarios' | 'empresa'>('funcionarios')

  const semDados =
    !satisfacao ||
    (satisfacao.categoriasFuncionarios.length === 0 &&
      satisfacao.categoriasEmpresa.length === 0)

  const categorias = satisfacao
    ? visao === 'funcionarios'
      ? satisfacao.categoriasFuncionarios
      : satisfacao.categoriasEmpresa
    : []
  const accentColor =
    visao === 'funcionarios' ? 'var(--sidebar)' : 'var(--primary)'
  const media = mediaDe(categorias)
  const deltaMedio = deltaMedioDe(categorias)
  const { fortes, atencao } = splitCategorias(categorias)

  return (
    <Card className="flex h-full flex-col overflow-hidden border-0">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="flex flex-col gap-1.5">
          <CardTitle className="text-base">
            {visao === 'funcionarios'
              ? 'Satisfação dos funcionários'
              : 'Satisfação da empresa'}
          </CardTitle>
          <CardDescription>
            {satisfacao?.totalAvaliacoes ?? 0} avaliações
          </CardDescription>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() =>
            setVisao((atual) =>
              atual === 'funcionarios' ? 'empresa' : 'funcionarios'
            )
          }
          aria-label={
            visao === 'funcionarios'
              ? 'Ver avaliação da empresa'
              : 'Ver avaliação dos funcionários'
          }
        >
          {visao === 'funcionarios' ? (
            <Building2 className="size-4" />
          ) : (
            <User className="size-4" />
          )}
        </Button>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-y-auto">
        {semDados ? (
          <EmptyState message="Ainda sem avaliações de satisfação." />
        ) : (
          <div className="flex h-full flex-col gap-4">
            <div className="flex items-center gap-4">
              <ScoreRing media={media} color={accentColor} />
              <div className="flex flex-col gap-1">
                <span className="text-lg font-semibold">
                  {getStatusLabel(media)}
                </span>
                <DeltaLabel delta={deltaMedio} />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {fortes.length > 0 ? (
                <div>
                  <span className="text-xs text-muted-foreground">
                    Pontos fortes
                  </span>
                  <div className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-2">
                    {fortes.map((categoria) => (
                      <CategoriaRow
                        key={categoria.categoria}
                        categoria={categoria}
                        accentColor={accentColor}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              {atencao.length > 0 ? (
                <div>
                  <span className="text-xs text-muted-foreground">
                    Pontos de atenção
                  </span>
                  <div className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-2">
                    {atencao.map((categoria) => (
                      <CategoriaRow
                        key={categoria.categoria}
                        categoria={categoria}
                        accentColor={accentColor}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
