import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card'
import { cn } from '@repo/ui/lib/utils'

import { formatCurrencyBRL } from '@/lib/formatters'
import { formatMes } from '../../lib/dre-helpers'
import type { DRE } from '../../lib/types'

export function DreCard({ dre, mes }: { dre: DRE; mes: string }) {
  const positivo = dre.lucro >= 0
  const faltaParaEmpatar = Math.max(dre.pontoEquilibrio - dre.receita, 0)

  return (
    <Card className="flex flex-col border-0 lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-base">Resultado de {formatMes(mes)}</CardTitle>
        <CardDescription>
          O que entrou menos o que saiu, contando só dinheiro que já se moveu.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-6 pt-0">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1 rounded-lg bg-muted p-4">
            <span className="text-xs text-muted-foreground">Entrou</span>
            <span className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatCurrencyBRL(dre.receita)}
            </span>
          </div>

          <div className="flex flex-col gap-1 rounded-lg bg-muted p-4">
            <span className="text-xs text-muted-foreground">Saiu</span>
            <span className="text-2xl font-bold tabular-nums text-destructive">
              {formatCurrencyBRL(dre.despesa)}
            </span>
          </div>

          <div
            className={cn(
              'flex flex-col gap-1 rounded-lg p-4',
              positivo ? 'bg-sidebar text-sidebar-foreground' : 'bg-destructive/10'
            )}
          >
            <span
              className={cn(
                'text-xs',
                positivo ? 'text-sidebar-foreground/70' : 'text-muted-foreground'
              )}
            >
              {positivo ? 'Sobrou' : 'Faltou'}
            </span>
            <span
              className={cn(
                'text-2xl font-bold tabular-nums',
                !positivo && 'text-destructive'
              )}
            >
              {formatCurrencyBRL(Math.abs(dre.lucro))}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t pt-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-sm text-muted-foreground">
              Custo fixo do mês
            </span>
            <span className="text-sm font-medium tabular-nums">
              {formatCurrencyBRL(dre.despesaFixa)}
            </span>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-sm text-muted-foreground">
              Custo que varia com a venda
            </span>
            <span className="text-sm font-medium tabular-nums">
              {formatCurrencyBRL(dre.despesaVariavel)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {faltaParaEmpatar > 0 ? (
              <>
                Para cobrir o fixo, ainda falta faturar{' '}
                <span className="font-medium text-foreground">
                  {formatCurrencyBRL(faltaParaEmpatar)}
                </span>{' '}
                neste mês.
              </>
            ) : dre.pontoEquilibrio > 0 ? (
              <>O custo fixo do mês já está coberto pelo que entrou.</>
            ) : (
              <>Nenhum custo fixo lançado neste mês.</>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
