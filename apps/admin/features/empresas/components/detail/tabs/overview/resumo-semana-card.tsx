import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card'
import { StatCard } from '@repo/ui/components/stat-card'

import { formatCurrencyBRL, formatShortDateBR } from '@/lib/formatters'
import type { EmpresaPausa } from '../../../../lib/types'
import { HeroStatPanel } from '../../../shared/hero-stat-panel'
import { TrendBadge } from '../../../shared/trend-badge'

export function ResumoSemanaCard({
  funcionariosAtivos,
  deltaFuncionarios,
  taxaResposta,
  deltaTaxaResposta,
  ultimoFaturamento,
  mostraFaturamento = true,
  proximaPausa,
}: {
  funcionariosAtivos: number
  deltaFuncionarios: number | null
  taxaResposta: string
  deltaTaxaResposta: number | null
  ultimoFaturamento: number | undefined
  mostraFaturamento?: boolean
  proximaPausa: EmpresaPausa | undefined
}) {
  return (
    <Card className="col-span-2 flex h-full flex-col overflow-hidden border-0">
      <CardHeader>
        <CardTitle className="text-base">Resumo da semana</CardTitle>
        <CardDescription>
          Visão geral rápida da operação com essa empresa
        </CardDescription>
      </CardHeader>
      <CardContent className="min-h-0 flex-1">
        <div className="grid h-full min-h-0 grid-cols-3 gap-4">
          <div className="grid h-full min-h-0 grid-rows-3 gap-3">
            <StatCard
              className="min-h-0 overflow-hidden"
              contentClassName="h-full justify-between gap-2 p-4"
              labelClassName="text-xs"
              label="Funcionários ativos"
              value={String(funcionariosAtivos)}
              trailing={<TrendBadge delta={deltaFuncionarios} />}
            />
            <StatCard
              className="row-span-2 min-h-0 overflow-hidden"
              contentClassName="h-full justify-between gap-2 p-4"
              labelClassName="text-xs"
              valueClassName="text-6xl truncate"
              label="Taxa de resposta"
              value={taxaResposta}
              trailing={<TrendBadge delta={deltaTaxaResposta} />}
            />
          </div>

          <HeroStatPanel
            className="col-span-2 min-h-0"
            label="Faturamento do mês"
            value={
              !mostraFaturamento
                ? 'R$ ••••••'
                : ultimoFaturamento != null
                  ? formatCurrencyBRL(ultimoFaturamento)
                  : '—'
            }
          >
            <div className="absolute bottom-0 right-0 z-10 rounded-tl-lg bg-card p-3 text-center text-card-foreground">
              <span className="text-[10px] text-muted-foreground">
                Próxima pausa
              </span>
              <p className="text-2xl font-bold">
                {proximaPausa ? formatShortDateBR(proximaPausa.data) : '—'}
              </p>
            </div>
          </HeroStatPanel>
        </div>
      </CardContent>
    </Card>
  )
}
