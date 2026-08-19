import type { ReactNode } from 'react'

import { cn } from '@repo/ui/lib/utils'

/**
 * Painel de destaque em madeira/dourado da sidebar — a mesma superfície da
 * "Placa do Quintal" usada como acento no Resumo da semana, reaproveitada
 * aqui pra qualquer número que mereça um degrau visual acima de um StatCard
 * comum (ex: faturamento). `children` é pra overlays específicos de um único
 * consumidor (ex: o cantinho de "Próxima pausa" do Resumo da semana).
 */
export function HeroStatPanel({
  label,
  value,
  className,
  children,
}: {
  label: string
  value: string
  className?: string
  children?: ReactNode
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg bg-sidebar p-4 text-sidebar-foreground',
        className
      )}
    >
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
        <span className="text-xs text-sidebar-foreground/70">{label}</span>
        <span className="truncate text-2xl font-bold">{value}</span>
      </div>

      {children}
    </div>
  )
}
