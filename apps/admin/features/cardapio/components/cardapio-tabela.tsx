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
import { Skeleton } from '@repo/ui/components/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/table'

import { formatShortDateBR } from '@/lib/formatters'
import { listarCardapioIntervaloAction } from '../lib/actions'
import type { CardapioDiaItem } from '../lib/types'

export function CardapioTabela({
  empresaNome,
  cardapioQtdAlternativas,
  from,
  to,
  atualizarKey,
}: {
  empresaNome: string
  cardapioQtdAlternativas: number
  from: string
  to: string
  atualizarKey: number
}) {
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
    buscar({ from, to })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, atualizarKey])

  const diasCortados = (dias ?? []).map((dia) => ({
    ...dia,
    alternativas: dia.alternativas.slice(0, cardapioQtdAlternativas),
  }))

  const maxAlternativas = Math.max(
    0,
    ...diasCortados.map((d) => d.alternativas.length)
  )

  return (
    <Card className="border-0">
      <CardHeader>
        <CardTitle className="text-base">
          Cardápio comum — como {empresaNome} vê
        </CardTitle>
      </CardHeader>
      <CardContent>
        {carregando || !dias ? (
          <Skeleton className="h-40 w-full" />
        ) : diasCortados.length === 0 ? (
          <EmptyState message="Nenhum cardápio gerado nesse período ainda." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead />
                  {diasCortados.map((dia) => (
                    <TableHead key={dia.data} className="text-center">
                      {formatShortDateBR(dia.data)}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-semibold">Prato do dia</TableCell>
                  {diasCortados.map((dia) => (
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
                    {diasCortados.map((dia) => (
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
