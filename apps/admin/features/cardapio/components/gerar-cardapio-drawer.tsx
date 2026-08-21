'use client'

import { useEffect, useState } from 'react'
import { useAction } from 'next-safe-action/hooks'
import { CalendarRange } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@repo/ui/components/button'
import { Checkbox } from '@repo/ui/components/checkbox'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@repo/ui/components/drawer'
import { Input } from '@repo/ui/components/input'
import { Label } from '@repo/ui/components/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select'

import { formatDateBR } from '@/lib/formatters'
import {
  confirmarCardapioMesAction,
  gerarPreviewCardapioAction,
  listarCatalogoAction,
} from '../lib/actions'
import type { PratoCatalogoItem } from '../lib/types'

interface DiaProposto {
  data: string
  destaqueId: string
  alternativaIds: string[]
}

const SEM_FEIJOADA = '__sem_feijoada__'

export function GerarCardapioDrawer({
  empresaId,
  onConfirmado,
}: {
  empresaId: string
  onConfirmado: () => void
}) {
  const [open, setOpen] = useState(false)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [itensPorDia, setItensPorDia] = useState('6')
  const [pratoFeijoadaId, setPratoFeijoadaId] = useState(SEM_FEIJOADA)
  const [catalogo, setCatalogo] = useState<PratoCatalogoItem[]>([])
  const [proposta, setProposta] = useState<DiaProposto[] | null>(null)

  const { execute: buscarCatalogo } = useAction(listarCatalogoAction, {
    onSuccess: ({ data }) => setCatalogo(data?.catalogo ?? []),
  })

  useEffect(() => {
    if (!open) return
    buscarCatalogo({ empresaId })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, empresaId])

  const catalogoAtivo = catalogo.filter((p) => p.ativo)
  const nomePorId = new Map(catalogo.map((p) => [p.id, p.nome]))

  const { execute: gerar, isExecuting: gerando } = useAction(
    gerarPreviewCardapioAction,
    {
      onSuccess: ({ data }) => {
        setProposta(
          (data?.proposta ?? []).map((dia) => ({
            data: dia.data,
            destaqueId: dia.destaque.id,
            alternativaIds: dia.alternativas.map((a) => a.id),
          }))
        )
      },
      onError: ({ error }) =>
        toast.error(error.serverError ?? 'Não foi possível gerar a prévia'),
    }
  )

  const { execute: confirmar, isExecuting: confirmando } = useAction(
    confirmarCardapioMesAction,
    {
      onSuccess: () => {
        toast.success('Cardápio confirmado')
        setOpen(false)
        setProposta(null)
        onConfirmado()
      },
      onError: ({ error }) =>
        toast.error(
          error.serverError ?? 'Não foi possível confirmar o cardápio'
        ),
    }
  )

  function gerarPreview() {
    if (!from || !to) return
    gerar({
      empresaId,
      from,
      to,
      itensPorDia: Number(itensPorDia) || 1,
      pratoFeijoadaId:
        pratoFeijoadaId === SEM_FEIJOADA ? null : pratoFeijoadaId,
    })
  }

  function trocarDestaque(data: string, novoDestaqueId: string) {
    setProposta((atual) =>
      (atual ?? []).map((dia) =>
        dia.data === data
          ? {
              ...dia,
              destaqueId: novoDestaqueId,
              alternativaIds: dia.alternativaIds.filter(
                (id) => id !== novoDestaqueId
              ),
            }
          : dia
      )
    )
  }

  function alternarAlternativa(data: string, pratoId: string) {
    setProposta((atual) =>
      (atual ?? []).map((dia) => {
        if (dia.data !== data) return dia
        const jaTem = dia.alternativaIds.includes(pratoId)
        return {
          ...dia,
          alternativaIds: jaTem
            ? dia.alternativaIds.filter((id) => id !== pratoId)
            : [...dia.alternativaIds, pratoId],
        }
      })
    )
  }

  return (
    <Drawer
      direction="right"
      open={open}
      handleOnly
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) setProposta(null)
      }}
    >
      <DrawerTrigger asChild>
        <Button size="sm">
          <CalendarRange className="size-4" />
          Gerar cardápio
        </Button>
      </DrawerTrigger>
      <DrawerContent
        direction="right"
        variant="float"
        className="flex w-full flex-col gap-0 sm:max-w-2xl"
      >
        <DrawerHeader>
          <DrawerTitle>Gerar cardápio</DrawerTitle>
          <DrawerDescription>
            Sorteia o prato do dia e as alternativas pro período — revise e
            ajuste cada dia antes de confirmar.
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-6">
          {!proposta ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">De</Label>
                  <Input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">Até</Label>
                  <Input
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">
                  Quantos pratos mostrar por dia (destaque + alternativas)
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={itensPorDia}
                  onChange={(e) => setItensPorDia(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">
                  Feijoada fixa toda quarta e sábado
                </Label>
                <Select
                  value={pratoFeijoadaId}
                  onValueChange={setPratoFeijoadaId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SEM_FEIJOADA}>
                      Não travar quarta/sábado
                    </SelectItem>
                    {catalogoAtivo.map((prato) => (
                      <SelectItem key={prato.id} value={prato.id}>
                        {prato.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="self-start"
                disabled={gerando || !from || !to || catalogoAtivo.length === 0}
                onClick={gerarPreview}
              >
                {gerando ? 'Sorteando...' : 'Sortear prévia'}
              </Button>
              {catalogoAtivo.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Cadastre pratos no catálogo antes de gerar o cardápio.
                </p>
              )}
            </>
          ) : (
            <div className="flex flex-col gap-4">
              {proposta.map((dia) => (
                <div key={dia.data} className="rounded-lg border p-3">
                  <p className="mb-2 text-sm font-semibold">
                    {formatDateBR(dia.data)}
                  </p>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">
                      Prato do dia
                    </Label>
                    <Select
                      value={dia.destaqueId}
                      onValueChange={(v) => trocarDestaque(dia.data, v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
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

                  <div className="mt-2 flex flex-col gap-1">
                    <Label className="text-xs text-muted-foreground">
                      Alternativas
                    </Label>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                      {catalogoAtivo
                        .filter((p) => p.id !== dia.destaqueId)
                        .map((prato) => (
                          <label
                            key={prato.id}
                            className="flex items-center gap-2 text-sm"
                          >
                            <Checkbox
                              checked={dia.alternativaIds.includes(prato.id)}
                              onCheckedChange={() =>
                                alternarAlternativa(dia.data, prato.id)
                              }
                            />
                            {nomePorId.get(prato.id)}
                          </label>
                        ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DrawerFooter className="flex-row justify-end gap-2 border-t">
          {proposta && (
            <Button
              variant="outline"
              onClick={() => setProposta(null)}
              disabled={confirmando}
            >
              Voltar
            </Button>
          )}
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          {proposta && (
            <Button
              disabled={confirmando}
              onClick={() => confirmar({ empresaId, dias: proposta })}
            >
              {confirmando ? 'Confirmando...' : 'Confirmar cardápio'}
            </Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
