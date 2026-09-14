'use client'

import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

import { Button } from '@repo/ui/components/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card'
import { Skeleton } from '@repo/ui/components/skeleton'
import { ToggleGroup, ToggleGroupItem } from '@repo/ui/components/toggle-group'

import { somarDiasISO } from '@/lib/dates'
import { formatDateBR, hojeISO } from '@/lib/formatters'
import { inicioDaSemanaISO, mesAdjacenteISO } from '../lib/calendario-helpers'
import type { CardapioDiaItem } from '../lib/types'
import { CardapioDiaCelula } from './cardapio-dia-celula'
import { CardapioMesView } from './cardapio-mes-view'

const formatadorMesAno = new Intl.DateTimeFormat('pt-BR', {
  month: 'long',
  year: 'numeric',
  timeZone: 'America/Sao_Paulo',
})

export function CardapioCalendario({
  visualizacao,
  onVisualizacaoChange,
  referencia,
  onReferenciaChange,
  dias,
  carregando,
  atualizando,
  onPromoverDestaque,
  onRemoverDestaque,
  onToggleEspecial,
  onToggleFixo,
  onRemoverItem,
}: {
  visualizacao: 'semana' | 'mes'
  onVisualizacaoChange: (v: 'semana' | 'mes') => void
  referencia: string
  onReferenciaChange: (data: string) => void
  dias: CardapioDiaItem[]
  carregando: boolean
  atualizando: boolean
  onPromoverDestaque: (diaData: string, diaId: string, itemId: string) => void
  onRemoverDestaque: (diaData: string, diaId: string) => void
  onToggleEspecial: (diaData: string, itemId: string, especial: boolean) => void
  onToggleFixo: (diaData: string, itemId: string, fixo: boolean) => void
  onRemoverItem: (diaData: string, itemId: string) => void
}) {
  const hoje = hojeISO()

  function navegar(delta: number) {
    if (visualizacao === 'semana') {
      onReferenciaChange(somarDiasISO(referencia, delta * 7))
    } else {
      onReferenciaChange(
        `${mesAdjacenteISO(referencia.slice(0, 7), delta)}-01`
      )
    }
  }

  const inicioSemana = inicioDaSemanaISO(referencia)
  const fimSemana = somarDiasISO(inicioSemana, 5)

  const tituloRange =
    visualizacao === 'semana'
      ? `${formatDateBR(inicioSemana).slice(0, 5)} a ${formatDateBR(fimSemana).slice(0, 5)}`
      : formatadorMesAno.format(new Date(`${referencia.slice(0, 7)}-01T12:00:00Z`))

  return (
    <Card className="border-0">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navegar(-1)}
            aria-label="Período anterior"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <CardTitle className="min-w-40 text-center text-base capitalize">
            {tituloRange}
          </CardTitle>
          <Button
            variant="outline"
            size="icon"
            onClick={() => navegar(1)}
            aria-label="Próximo período"
          >
            <ChevronRight className="size-4" />
          </Button>
          {atualizando && (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          )}
          {referencia !== hoje && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReferenciaChange(hoje)}
            >
              Hoje
            </Button>
          )}
        </div>

        <ToggleGroup
          type="single"
          variant="outline"
          value={visualizacao}
          onValueChange={(v) =>
            v && onVisualizacaoChange(v as 'semana' | 'mes')
          }
        >
          <ToggleGroupItem value="semana">Semana</ToggleGroupItem>
          <ToggleGroupItem value="mes">Mês</ToggleGroupItem>
        </ToggleGroup>
      </CardHeader>

      <CardContent>
        {carregando ? (
          <Skeleton className="h-96 w-full" />
        ) : visualizacao === 'mes' ? (
          <CardapioMesView
            mes={referencia.slice(0, 7)}
            dias={dias}
            onSelecionarDia={(data) => {
              onReferenciaChange(data)
              onVisualizacaoChange('semana')
            }}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {Array.from({ length: 6 }, (_, i) =>
              somarDiasISO(inicioSemana, i)
            ).map((data) => {
              const dia: CardapioDiaItem = dias.find(
                (d) => d.data === data
              ) ?? { diaId: null, data, destaque: null, alternativas: [] }
              return (
                <CardapioDiaCelula
                  key={data}
                  dia={dia}
                  onPromoverDestaque={(itemId) =>
                    dia.diaId && onPromoverDestaque(data, dia.diaId, itemId)
                  }
                  onRemoverDestaque={() =>
                    dia.diaId && onRemoverDestaque(data, dia.diaId)
                  }
                  onToggleEspecial={(itemId, especial) =>
                    onToggleEspecial(data, itemId, especial)
                  }
                  onToggleFixo={(itemId, fixo) =>
                    onToggleFixo(data, itemId, fixo)
                  }
                  onRemoverItem={(itemId) => onRemoverItem(data, itemId)}
                />
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
