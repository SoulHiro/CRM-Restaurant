import { Star } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card'
import { EmptyState } from '@repo/ui/components/empty-state'
import { cn } from '@repo/ui/lib/utils'

import type { EmpresaSatisfacao } from '../../../../lib/types'

export function SatisfacaoCard({
  satisfacao,
}: {
  satisfacao?: EmpresaSatisfacao
}) {
  return (
    <Card className="border-0">
      <CardHeader>
        <CardTitle className="text-base">Satisfação dos funcionários</CardTitle>
        <CardDescription>Média das avaliações recebidas</CardDescription>
      </CardHeader>
      <CardContent>
        {!satisfacao ? (
          <EmptyState message="Ainda sem avaliações de satisfação." />
        ) : (
          <div className="flex flex-col gap-2">
            <span className="text-2xl font-semibold">
              {satisfacao.media.toFixed(1)}
              <span className="text-base font-normal text-muted-foreground">
                {' '}
                / 5
              </span>
            </span>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  className={cn(
                    'size-4',
                    index < Math.round(satisfacao.media)
                      ? 'fill-primary text-primary'
                      : 'text-muted-foreground'
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              Baseado em {satisfacao.totalAvaliacoes} avaliações
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
