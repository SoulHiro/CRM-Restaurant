import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card'
import { cn } from '@repo/ui/lib/utils'

import { formatCurrencyBRL, formatPercentBR } from '@/lib/formatters'
import { ORIGEM_LABELS, SUBTIPO_LABELS } from '../../lib/dre-helpers'
import type { FatiaOrigem, FatiaSubtipo } from '../../lib/types'

function Fatia({
  rotulo,
  valor,
  percentual,
  cor,
}: {
  rotulo: string
  valor: number
  percentual: number
  cor: string
}) {
  return (
    <li className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="truncate text-sm">{rotulo}</span>
        <span className="shrink-0 text-sm font-medium tabular-nums">
          {formatCurrencyBRL(valor)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className={cn('h-full rounded-full', cor)}
            style={{ width: `${Math.min(percentual, 100)}%` }}
          />
        </div>
        <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
          {formatPercentBR(percentual)}%
        </span>
      </div>
    </li>
  )
}

export function OrigemBreakdownCard({
  receitas,
  despesas,
}: {
  receitas: FatiaOrigem[]
  despesas: FatiaSubtipo[]
}) {
  const vazio = receitas.length === 0 && despesas.length === 0

  return (
    <Card className="flex flex-col border-0 lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-base">Por onde entrou e saiu</CardTitle>
        <CardDescription>
          Onde o dinheiro do mês foi feito e onde ele foi embora.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 pt-0">
        {vazio ? (
          <p className="flex h-full items-center text-sm text-muted-foreground">
            Nenhum lançamento neste mês ainda.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-3">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Entradas
              </span>
              {receitas.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nada entrou neste mês.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {receitas.map((fatia) => (
                    <Fatia
                      key={fatia.origem}
                      rotulo={ORIGEM_LABELS[fatia.origem]}
                      valor={fatia.valor}
                      percentual={fatia.percentual}
                      cor="bg-emerald-500"
                    />
                  ))}
                </ul>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Saídas
              </span>
              {despesas.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nada saiu neste mês.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {despesas.map((fatia) => (
                    <Fatia
                      key={fatia.subtipo}
                      rotulo={SUBTIPO_LABELS[fatia.subtipo]}
                      valor={fatia.valor}
                      percentual={fatia.percentual}
                      cor="bg-destructive"
                    />
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
