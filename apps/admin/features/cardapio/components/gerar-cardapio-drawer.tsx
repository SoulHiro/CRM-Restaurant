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
import { ToggleGroup, ToggleGroupItem } from '@repo/ui/components/toggle-group'

import { somarDiasISO } from '@/lib/dates'
import { formatDateBR, formatShortDateBR, hojeISO } from '@/lib/formatters'
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

/** Dia da semana como número (0 = domingo) — puro cálculo de calendário, sem fuso. */
function diaDaSemana(data: string): number {
  const [ano, mes, dia] = data.split('-').map(Number)
  return new Date(Date.UTC(ano!, mes! - 1, dia!)).getUTCDay()
}

function ultimoDiaDoMesISO(mes: string): string {
  const [ano, mesNum] = mes.split('-').map(Number)
  const ultimoDia = new Date(Date.UTC(ano!, mesNum!, 0)).getUTCDate()
  return `${mes}-${String(ultimoDia).padStart(2, '0')}`
}

/** Segunda-feira mais próxima a partir de hoje (hoje incluso, se já for segunda). */
function proximaSegundaISO(): string {
  const hoje = hojeISO()
  const diaSemana = diaDaSemana(hoje)
  const deslocamento = diaSemana === 0 ? 1 : diaSemana === 1 ? 0 : 8 - diaSemana
  return somarDiasISO(hoje, deslocamento)
}

/** O sorteio nunca inclui domingo, então cada nova segunda-feira é o início de uma semana. */
function agruparPorSemana(dias: DiaProposto[]): DiaProposto[][] {
  const semanas: DiaProposto[][] = []
  for (const dia of dias) {
    const inicioDeSemana = diaDaSemana(dia.data) === 1 || semanas.length === 0
    if (inicioDeSemana) {
      semanas.push([dia])
    } else {
      semanas[semanas.length - 1]!.push(dia)
    }
  }
  return semanas
}

export function GerarCardapioDrawer({
  onConfirmado,
}: {
  onConfirmado: () => void
}) {
  const [open, setOpen] = useState(false)
  const [periodo, setPeriodo] = useState<'semana' | 'mes'>('mes')
  const [mes, setMes] = useState(() => hojeISO().slice(0, 7))
  const [semanaInicio, setSemanaInicio] = useState(proximaSegundaISO)
  const [itensPorDia, setItensPorDia] = useState('13')
  const [pratoFeijoadaId, setPratoFeijoadaId] = useState(SEM_FEIJOADA)
  const [catalogo, setCatalogo] = useState<PratoCatalogoItem[]>([])
  const [proposta, setProposta] = useState<DiaProposto[] | null>(null)

  const { execute: buscarCatalogo } = useAction(listarCatalogoAction, {
    onSuccess: ({ data }) => setCatalogo(data?.catalogo ?? []),
  })

  useEffect(() => {
    if (!open) return
    buscarCatalogo({})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const catalogoAtivo = catalogo.filter((p) => p.ativo)
  const nomePorId = new Map(catalogo.map((p) => [p.id, p.nome]))
  const semanas = proposta ? agruparPorSemana(proposta) : []

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
    const from = periodo === 'mes' ? `${mes}-01` : semanaInicio
    const to =
      periodo === 'mes' ? ultimoDiaDoMesISO(mes) : somarDiasISO(semanaInicio, 5)
    if (!from || !to) return
    gerar({
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
            Um cardápio só pro restaurante inteiro — cada empresa mostra na
            página dela só as N primeiras alternativas (configurável na aba
            Configurações de cada empresa). Revise e ajuste antes de confirmar.
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-6">
          {!proposta ? (
            <>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Período</Label>
                <p className="text-xs text-muted-foreground">
                  Sempre de segunda a sábado — o mês inteiro de uma vez ou só
                  a semana que vem.
                </p>
                <ToggleGroup
                  type="single"
                  variant="outline"
                  value={periodo}
                  onValueChange={(v) => v && setPeriodo(v as 'semana' | 'mes')}
                >
                  <ToggleGroupItem value="mes">Mês inteiro</ToggleGroupItem>
                  <ToggleGroupItem value="semana">
                    Semana que vem
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              {periodo === 'mes' ? (
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">Mês</Label>
                  <Input
                    type="month"
                    className="w-full sm:w-48"
                    value={mes}
                    onChange={(e) => setMes(e.target.value)}
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">Semana de</Label>
                  <Input
                    type="date"
                    className="w-full sm:w-48"
                    value={semanaInicio}
                    onChange={(e) => setSemanaInicio(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Até {formatDateBR(somarDiasISO(semanaInicio, 5))} (sábado).
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">
                  Quantos pratos gerar por dia (destaque + alternativas)
                </Label>
                <p className="text-xs text-muted-foreground">
                  Use o maior número entre as empresas — cada uma corta pra
                  quantas ela precisa na hora de mostrar.
                </p>
                <Input
                  type="number"
                  min="1"
                  max="30"
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
                disabled={
                  gerando ||
                  (periodo === 'mes' ? !mes : !semanaInicio) ||
                  catalogoAtivo.length === 0
                }
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
            <div className="flex flex-col gap-6">
              {semanas.map((semana) => (
                <div key={semana[0]!.data} className="flex flex-col gap-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Semana de {formatShortDateBR(semana[0]!.data)} a{' '}
                    {formatShortDateBR(semana[semana.length - 1]!.data)}
                  </p>
                  <div className="flex flex-col gap-4">
                    {semana.map((dia) => (
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
                            Alternativas (ordem = quem entra primeiro nas
                            empresas com menos vagas)
                          </Label>
                          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                            {dia.alternativaIds.map((id, indice) => (
                              <span key={id} className="text-sm">
                                {indice + 1}. {nomePorId.get(id)}
                              </span>
                            ))}
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
                            {catalogoAtivo
                              .filter((p) => p.id !== dia.destaqueId)
                              .map((prato) => (
                                <label
                                  key={prato.id}
                                  className="flex items-center gap-2 text-sm"
                                >
                                  <Checkbox
                                    checked={dia.alternativaIds.includes(
                                      prato.id
                                    )}
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
              onClick={() => confirmar({ dias: proposta })}
            >
              {confirmando ? 'Confirmando...' : 'Confirmar cardápio'}
            </Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
