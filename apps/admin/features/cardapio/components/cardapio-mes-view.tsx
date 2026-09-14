'use client'

import { cn } from '@repo/ui/lib/utils'

import { somarDiasISO } from '@/lib/dates'
import { hojeISO } from '@/lib/formatters'
import { semanasDoMesCompleto } from '../lib/calendario-helpers'
import type { CardapioDiaItem } from '../lib/types'

const DIAS_SEMANA_CURTO = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

/**
 * Visão só de leitura — o mês inteiro de uma vez não cabe pra editar direito
 * (arrastar/reordenar precisa da coluna larga da semana). Clicar num dia
 * troca pra visualização semanal já na semana dele.
 */
export function CardapioMesView({
  mes,
  dias,
  onSelecionarDia,
}: {
  mes: string
  dias: CardapioDiaItem[]
  onSelecionarDia: (data: string) => void
}) {
  const semanas = semanasDoMesCompleto(mes)
  const porData = new Map(dias.map((d) => [d.data, d]))
  const hoje = hojeISO()

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-6 gap-2">
        {DIAS_SEMANA_CURTO.map((label) => (
          <p
            key={label}
            className="text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            {label}
          </p>
        ))}
      </div>

      {semanas.map((semana) => (
        <div key={semana.inicio} className="grid grid-cols-6 gap-2">
          {Array.from({ length: 6 }, (_, i) => somarDiasISO(semana.inicio, i)).map(
            (data) => {
              const foraDoMes = data.slice(0, 7) !== mes
              const dia = porData.get(data)
              const fixoAlternativa = dia?.alternativas.find((a) => a.fixo)
              const demaisCount =
                (dia?.alternativas.length ?? 0) - (fixoAlternativa ? 1 : 0)

              return (
                <button
                  key={data}
                  type="button"
                  onClick={() => onSelecionarDia(data)}
                  className={cn(
                    'flex min-h-20 flex-col items-start gap-1 rounded-lg bg-muted p-2 text-left transition-colors hover:bg-accent',
                    foraDoMes && 'opacity-40'
                  )}
                >
                  <span
                    className={cn(
                      'text-xs font-medium text-muted-foreground',
                      data === hoje && 'text-primary'
                    )}
                  >
                    {data.slice(8, 10)}
                  </span>
                  {dia?.destaque && (
                    <span className="line-clamp-2 text-xs font-medium text-primary">
                      {dia.destaque.nome}
                    </span>
                  )}
                  {fixoAlternativa && (
                    <span className="line-clamp-2 text-xs font-medium text-sky-600 dark:text-sky-400">
                      {fixoAlternativa.nome}
                    </span>
                  )}
                  {demaisCount > 0 && (
                    <span className="text-xs text-muted-foreground">
                      +{demaisCount}
                    </span>
                  )}
                </button>
              )
            }
          )}
        </div>
      ))}
    </div>
  )
}
