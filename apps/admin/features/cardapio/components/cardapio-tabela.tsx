'use client'

import { useEffect, useState } from 'react'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card'
import { EmptyState } from '@repo/ui/components/empty-state'
import { Input } from '@repo/ui/components/input'
import { Label } from '@repo/ui/components/label'
import { Skeleton } from '@repo/ui/components/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/table'

import { formatShortDateBR, hojeISO } from '@/lib/formatters'
import { somarDiasISO } from '@/lib/dates'
import { listarCardapioIntervaloAction } from '../lib/actions'
import type { CardapioDiaItem } from '../lib/types'

function inicioDaSemana(): string {
  const hoje = new Date(`${hojeISO()}T00:00:00Z`)
  const diaSemana = hoje.getUTCDay()
  const voltarPraSegunda = diaSemana === 0 ? 6 : diaSemana - 1
  return somarDiasISO(hojeISO(), -voltarPraSegunda)
}

export function CardapioTabela({
  empresaId,
  atualizarKey,
}: {
  empresaId: string
  atualizarKey: number
}) {
  const [from, setFrom] = useState(inicioDaSemana)
  const [to, setTo] = useState(() => somarDiasISO(inicioDaSemana(), 5))
  const [dias, setDias] = useState<CardapioDiaItem[] | null>(null)

  const { execute: buscar, isExecuting: carregando } = useAction(
    listarCardapioIntervaloAction,
    {
      onSuccess: ({ data }) => setDias(data?.dias ?? []),
      onError: () => toast.error('Não foi possível carregar o cardápio'),
    }
  )

  useEffect(() => {
    setDias(null)
    buscar({ empresaId, from, to })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId, from, to, atualizarKey])

  const maxAlternativas = Math.max(
    0,
    ...(dias ?? []).map((d) => d.alternativas.length)
  )

  return (
    <Card className="border-0">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle className="text-base">Cardápio gerado</CardTitle>
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-1">
            <Label className="text-xs">De</Label>
            <Input
              type="date"
              className="h-8 w-36"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Até</Label>
            <Input
              type="date"
              className="h-8 w-36"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {carregando || !dias ? (
          <Skeleton className="h-40 w-full" />
        ) : dias.length === 0 ? (
          <EmptyState message="Nenhum cardápio gerado nesse período ainda." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead />
                  {dias.map((dia) => (
                    <TableHead key={dia.data} className="text-center">
                      {formatShortDateBR(dia.data)}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-semibold">Prato do dia</TableCell>
                  {dias.map((dia) => (
                    <TableCell
                      key={dia.data}
                      className="text-center font-semibold text-primary"
                    >
                      {dia.destaque?.nome ?? '—'}
                    </TableCell>
                  ))}
                </TableRow>
                {Array.from({ length: maxAlternativas }, (_, indice) => (
                  <TableRow key={indice}>
                    <TableCell />
                    {dias.map((dia) => (
                      <TableCell key={dia.data} className="text-center">
                        {dia.alternativas[indice]?.nome ?? ''}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
