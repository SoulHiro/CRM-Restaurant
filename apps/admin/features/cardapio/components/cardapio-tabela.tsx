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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select'
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
  empresas,
  atualizarKey,
}: {
  empresas: { id: string; nome: string; cardapioQtdAlternativas: number }[]
  atualizarKey: number
}) {
  const [empresaId, setEmpresaId] = useState(empresas[0]?.id ?? '')
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
    buscar({ from, to })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, atualizarKey])

  const qtdAlternativas =
    empresas.find((e) => e.id === empresaId)?.cardapioQtdAlternativas ?? 5

  const diasCortados = (dias ?? []).map((dia) => ({
    ...dia,
    alternativas: dia.alternativas.slice(0, qtdAlternativas),
  }))

  const maxAlternativas = Math.max(
    0,
    ...diasCortados.map((d) => d.alternativas.length)
  )

  return (
    <Card className="border-0">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle className="text-base">
          Cardápio gerado — como{' '}
          {empresas.find((e) => e.id === empresaId)?.nome ?? 'a empresa'} vê
        </CardTitle>
        <div className="flex items-center gap-2">
          <Select value={empresaId} onValueChange={setEmpresaId}>
            <SelectTrigger className="h-8 w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {empresas.map((empresa) => (
                <SelectItem key={empresa.id} value={empresa.id}>
                  {empresa.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
