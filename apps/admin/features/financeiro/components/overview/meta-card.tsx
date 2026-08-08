import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card'
import { cn } from '@repo/ui/lib/utils'

import {
  formatCurrencyBRL,
  formatDateBR,
  formatPercentBR,
} from '@/lib/formatters'
import type { ProgressoMeta } from '../../lib/types'
import { CriarMetaDrawer } from '../form/meta-drawer'
import { AjustarMetaDrawer } from '../form/ajuste-meta-drawer'

export function MetaCard({
  progresso,
  hoje,
}: {
  progresso: ProgressoMeta | null
  hoje: string
}) {
  if (!progresso) {
    return (
      <Card className="flex flex-col border-0">
        <CardHeader>
          <CardTitle className="text-base">Meta</CardTitle>
          <CardDescription>
            Defina quanto precisa juntar e até quando — o acompanhamento sai
            sozinho do que já foi lançado.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 items-end pt-0">
          <CriarMetaDrawer hoje={hoje} />
        </CardContent>
      </Card>
    )
  }

  const { meta } = progresso
  const barra = Math.min(Math.max(progresso.percentual, 0), 100)

  return (
    <Card className="flex flex-col border-0">
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1.5">
          <CardTitle className="text-base">{meta.descricao}</CardTitle>
          <CardDescription>
            {formatCurrencyBRL(meta.valorAlvo ?? 0)} até{' '}
            {formatDateBR(meta.prazo)}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 pt-0">
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-2">
            <span
              className={cn(
                'text-3xl font-bold tabular-nums',
                progresso.acumulado < 0 && 'text-destructive'
              )}
            >
              {formatCurrencyBRL(progresso.acumulado)}
            </span>
            <span
              className={cn(
                'text-sm font-medium tabular-nums',
                progresso.atingida
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-muted-foreground'
              )}
            >
              {formatPercentBR(progresso.percentual)}%
            </span>
          </div>

          <div
            className="h-2 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={barra}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progresso da meta"
          >
            <div
              className={cn(
                'h-full rounded-full transition-all',
                progresso.atingida ? 'bg-emerald-500' : 'bg-primary'
              )}
              style={{ width: `${barra}%` }}
            />
          </div>
        </div>

        {progresso.atingida ? (
          <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
            Meta batida. O que entrar daqui pra frente é folga.
          </p>
        ) : progresso.vencida ? (
          <p className="text-sm font-medium text-destructive">
            Prazo vencido — faltaram {formatCurrencyBRL(progresso.falta)}.
          </p>
        ) : (
          <div className="flex flex-col gap-1 text-sm text-muted-foreground">
            <p>
              Faltam{' '}
              <span className="font-medium text-foreground">
                {formatCurrencyBRL(progresso.falta)}
              </span>{' '}
              em {progresso.diasRestantes}{' '}
              {progresso.diasRestantes === 1 ? 'dia' : 'dias'}.
            </p>
            <p>
              Dá{' '}
              <span className="font-medium text-foreground">
                {formatCurrencyBRL(progresso.ritmoSemanal)}
              </span>{' '}
              por semana.
            </p>
          </div>
        )}

        <div className="mt-auto flex flex-col gap-2 border-t pt-4 text-xs text-muted-foreground">
          <div className="flex justify-between gap-2">
            <span>Lucro no período</span>
            <span className="tabular-nums">
              {formatCurrencyBRL(progresso.lucroPeriodo)}
            </span>
          </div>
          {progresso.ajustes !== 0 && (
            <div className="flex justify-between gap-2">
              <span>Aportes e retiradas</span>
              <span className="tabular-nums">
                {formatCurrencyBRL(progresso.ajustes)}
              </span>
            </div>
          )}
          <AjustarMetaDrawer metaId={meta.id} hoje={hoje} />
        </div>
      </CardContent>
    </Card>
  )
}
