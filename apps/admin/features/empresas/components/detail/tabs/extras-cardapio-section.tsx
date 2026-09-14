'use client'

import { useEffect, useState } from 'react'
import { useAction } from 'next-safe-action/hooks'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@repo/ui/components/button'
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
  adicionarExtraEmpresaAction,
  listarCatalogoAction,
  listarExtrasEmpresaAction,
  removerExtraEmpresaAction,
} from '@/features/cardapio/lib/actions'
import type {
  ExtraEmpresaItem,
  PratoCatalogoItem,
} from '@/features/cardapio/lib/types'
import { somarDiasISO } from '@/lib/dates'
import { formatDateBR, hojeISO } from '@/lib/formatters'

/**
 * Prato exclusivo dessa empresa (contrato específico, ex: LNR) — soma uma
 * opção a mais só pra ela, por cima do cardápio comum. Sempre cadastrado à
 * mão aqui, nunca entra no sorteio nem no corte de alternativas.
 */
export function ExtrasCardapioSection({
  empresaId,
  empresaNome,
}: {
  empresaId: string
  empresaNome: string
}) {
  const [from, setFrom] = useState(hojeISO)
  const [to, setTo] = useState(() => somarDiasISO(hojeISO(), 30))
  const [extras, setExtras] = useState<ExtraEmpresaItem[] | null>(null)
  const [catalogo, setCatalogo] = useState<PratoCatalogoItem[]>([])
  const [novaData, setNovaData] = useState(from)
  const [novoPratoId, setNovoPratoId] = useState('')

  const { execute: buscarExtras, isExecuting: carregando } = useAction(
    listarExtrasEmpresaAction,
    {
      onSuccess: ({ data }) => setExtras(data?.extras ?? []),
      onError: () => toast.error('Não foi possível carregar os extras'),
    }
  )

  const { execute: buscarCatalogo } = useAction(listarCatalogoAction, {
    onSuccess: ({ data }) => setCatalogo(data?.catalogo ?? []),
  })

  useEffect(() => {
    setExtras(null)
    buscarExtras({ empresaId, from, to })
    buscarCatalogo({})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId, from, to])

  const catalogoAtivo = catalogo.filter((p) => p.ativo)

  const { execute: adicionar, isExecuting: adicionando } = useAction(
    adicionarExtraEmpresaAction,
    {
      onSuccess: () => {
        toast.success('Extra adicionado')
        setNovoPratoId('')
        buscarExtras({ empresaId, from, to })
      },
      onError: () => toast.error('Não foi possível adicionar o extra'),
    }
  )

  const { execute: remover } = useAction(removerExtraEmpresaAction, {
    onSuccess: () => buscarExtras({ empresaId, from, to }),
    onError: () => toast.error('Não foi possível remover o extra'),
  })

  function confirmarAdicao() {
    if (!novaData || !novoPratoId) return
    adicionar({ empresaId, data: novaData, pratoCatalogoId: novoPratoId })
  }

  return (
    <Card className="border-0">
      <CardHeader>
        <CardTitle className="text-base">
          Pratos extras — {empresaNome}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Só essa empresa vê — soma como mais uma opção no dia, sem contar no
          corte de alternativas nem entrar no sorteio.
        </p>

        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Ver extras de</Label>
            <Input
              type="date"
              className="h-9 w-40"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Até</Label>
            <Input
              type="date"
              className="h-9 w-40"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-2 border-t pt-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Dia
            </label>
            <Input
              type="date"
              className="h-9 w-40"
              min={from}
              max={to}
              value={novaData}
              onChange={(e) => setNovaData(e.target.value)}
            />
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Prato
            </label>
            <Select value={novoPratoId} onValueChange={setNovoPratoId}>
              <SelectTrigger className="h-9 w-full min-w-40">
                <SelectValue placeholder="Escolher prato" />
              </SelectTrigger>
              <SelectContent>
                {catalogoAtivo.map((prato) => (
                  <SelectItem key={prato.id} value={prato.id}>
                    {prato.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            size="sm"
            disabled={adicionando || !novaData || !novoPratoId}
            onClick={confirmarAdicao}
          >
            <Plus className="size-4" />
            Adicionar
          </Button>
        </div>

        {carregando || !extras ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : extras.length === 0 ? (
          <EmptyState message="Nenhum extra cadastrado nesse período." />
        ) : (
          <div className="flex flex-col gap-2">
            {extras.map((extra) => (
              <div
                key={extra.id}
                className="flex items-center justify-between gap-3 rounded-lg bg-card p-3 text-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-primary">
                    {formatDateBR(extra.data)}
                  </span>
                  <span>{extra.prato.nome}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remover extra ${extra.prato.nome} de ${formatDateBR(extra.data)}`}
                  onClick={() => remover({ extraId: extra.id })}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
