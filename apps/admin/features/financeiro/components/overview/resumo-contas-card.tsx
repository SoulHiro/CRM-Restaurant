import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card'

import { formatCurrencyBRL } from '@/lib/formatters'
import type { ResumoContas } from '../../lib/types'

function Linha({
  rotulo,
  total,
  atrasado,
  atrasadoQtd,
}: {
  rotulo: string
  total: number
  atrasado: number
  atrasadoQtd: number
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-muted p-4">
      <span className="text-xs text-muted-foreground">{rotulo}</span>
      <span className="text-xl font-bold tabular-nums">
        {formatCurrencyBRL(total)}
      </span>
      {atrasadoQtd > 0 ? (
        <span className="text-xs font-medium text-destructive">
          {formatCurrencyBRL(atrasado)} em atraso ({atrasadoQtd}{' '}
          {atrasadoQtd === 1 ? 'conta' : 'contas'})
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">Nada em atraso</span>
      )}
    </div>
  )
}

export function ResumoContasCard({ resumo }: { resumo: ResumoContas }) {
  const saldoPrevisto = resumo.receberPendente - resumo.pagarPendente

  return (
    <Card className="flex flex-col border-0">
      <CardHeader>
        <CardTitle className="text-base">Em aberto</CardTitle>
        <CardDescription>
          O que ainda não virou dinheiro — não entra no resultado acima.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 pt-0">
        <div className="grid gap-3 sm:grid-cols-2">
          <Linha
            rotulo="A receber"
            total={resumo.receberPendente}
            atrasado={resumo.receberAtrasado}
            atrasadoQtd={resumo.receberAtrasadoQtd}
          />
          <Linha
            rotulo="A pagar"
            total={resumo.pagarPendente}
            atrasado={resumo.pagarAtrasado}
            atrasadoQtd={resumo.pagarAtrasadoQtd}
          />
        </div>

        <div className="mt-auto flex flex-wrap items-baseline justify-between gap-2 border-t pt-4">
          <span className="text-sm text-muted-foreground">
            Se tudo for quitado
          </span>
          <span
            className={
              saldoPrevisto >= 0
                ? 'text-sm font-medium tabular-nums text-emerald-600 dark:text-emerald-400'
                : 'text-sm font-medium tabular-nums text-destructive'
            }
          >
            {saldoPrevisto >= 0 ? '+' : '−'}
            {formatCurrencyBRL(Math.abs(saldoPrevisto))}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
