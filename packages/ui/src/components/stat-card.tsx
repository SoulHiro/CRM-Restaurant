import type { ReactNode } from 'react'

import { Card, CardContent } from '@repo/ui/components/card'
import { cn } from '@repo/ui/lib/utils'

export interface StatCardProps {
  label: string
  value: string
  trailing?: ReactNode
  className?: string
  contentClassName?: string
  labelClassName?: string
  valueClassName?: string
}

export function StatCard({
  label,
  value,
  trailing,
  className,
  contentClassName,
  labelClassName,
  valueClassName,
}: StatCardProps) {
  return (
    <Card className={cn('border-0', className)}>
      <CardContent className={cn('flex flex-col gap-1 pt-6', contentClassName)}>
        <span className={cn('text-sm text-muted-foreground', labelClassName)}>
          {label}
        </span>
        {trailing ? (
          <div className="flex min-w-0 items-end justify-between gap-2">
            <span
              className={cn(
                'min-w-0 font-bold leading-none',
                valueClassName ?? 'text-3xl'
              )}
            >
              {value}
            </span>
            {trailing}
          </div>
        ) : (
          <span className={cn('text-2xl font-semibold', valueClassName)}>
            {value}
          </span>
        )}
      </CardContent>
    </Card>
  )
}
