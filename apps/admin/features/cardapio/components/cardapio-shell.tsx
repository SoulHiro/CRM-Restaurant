'use client'

import { useEffect, useRef, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useAction } from 'next-safe-action/hooks'
import { UtensilsCrossed } from 'lucide-react'
import { toast } from 'sonner'

import { SetHeaderContent } from '@/components/header-slot'
import { somarDiasISO } from '@/lib/dates'
import { hojeISO } from '@/lib/formatters'
import {
  adicionarItemDiaAction,
  desfixarItemAction,
  fixarItemAction,
  listarCardapioIntervaloAction,
  marcarEspecialAction,
  promoverDestaqueAction,
  removerDestaqueAction,
  removerItemDiaAction,
  reordenarAlternativasAction,
} from '../lib/actions'
import {
  inicioDaSemanaISO,
  mesAdjacenteISO,
  ultimoDiaDoMesISO,
} from '../lib/calendario-helpers'
import type { CardapioDiaItem } from '../lib/types'
import { CardapioCalendario } from './cardapio-calendario'
import { CardapioHeaderCenter } from './cardapio-header-center'
import { PratosCatalogoList } from './pratos-catalogo-list'

type DragDataCatalogo = { type: 'catalogo'; pratoId: string; nome: string }
type DragDataItem = { type: 'item'; diaData: string }
type DropDataDia = { type: 'dia'; data: string }
type DropDataItem = { type: 'item'; diaData: string }

/** `{from, to}` do período visível pra um modo+referência — usado tanto pro período atual quanto pra prefetch dos vizinhos. */
function calcularIntervalo(
  modo: 'semana' | 'mes',
  referencia: string
): { from: string; to: string } {
  if (modo === 'semana') {
    const inicio = inicioDaSemanaISO(referencia)
    return { from: inicio, to: somarDiasISO(inicio, 5) }
  }
  const mes = referencia.slice(0, 7)
  return { from: `${mes}-01`, to: ultimoDiaDoMesISO(mes) }
}

function chaveIntervalo(from: string, to: string): string {
  return `${from}_${to}`
}

export function CardapioShell() {
  const [visualizacao, setVisualizacao] = useState<'semana' | 'mes'>('semana')
  const [referencia, setReferencia] = useState(hojeISO)
  const [dias, setDias] = useState<CardapioDiaItem[]>([])
  const [carregando, setCarregando] = useState(true)
  const [carregouUmaVez, setCarregouUmaVez] = useState(false)
  const [arrastando, setArrastando] = useState<DragDataCatalogo | null>(null)
  const cacheRef = useRef(new Map<string, CardapioDiaItem[]>())

  const { from, to } = calcularIntervalo(visualizacao, referencia)

  const { execute: buscar } = useAction(listarCardapioIntervaloAction, {
    onSuccess: ({ data, input }) => {
      const novosDias = data?.dias ?? []
      cacheRef.current.set(chaveIntervalo(input.from, input.to), novosDias)
      setDias(novosDias)
    },
    onError: () => toast.error('Não foi possível carregar o cardápio'),
    onSettled: () => {
      setCarregando(false)
      setCarregouUmaVez(true)
    },
  })

  // Prefetch silencioso — nunca toca no estado visível, só esquenta o cache.
  const { execute: prefetch } = useAction(listarCardapioIntervaloAction, {
    onSuccess: ({ data, input }) => {
      cacheRef.current.set(
        chaveIntervalo(input.from, input.to),
        data?.dias ?? []
      )
    },
  })

  useEffect(() => {
    const emCache = cacheRef.current.get(chaveIntervalo(from, to))
    if (emCache) {
      // Já visitamos esse período — mostra na hora e revalida por trás, sem
      // apagar a tela enquanto isso (troca de semana/mês parece instantânea).
      setDias(emCache)
      setCarregouUmaVez(true)
      buscar({ from, to })
    } else {
      setCarregando(true)
      buscar({ from, to })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to])

  // Esquenta o cache dos períodos vizinhos em segundo plano, pra quando o
  // admin clicar no chevron a resposta já estar pronta.
  useEffect(() => {
    const refAnterior =
      visualizacao === 'semana'
        ? somarDiasISO(referencia, -7)
        : `${mesAdjacenteISO(referencia.slice(0, 7), -1)}-01`
    const refSeguinte =
      visualizacao === 'semana'
        ? somarDiasISO(referencia, 7)
        : `${mesAdjacenteISO(referencia.slice(0, 7), 1)}-01`

    for (const ref of [refAnterior, refSeguinte]) {
      const intervalo = calcularIntervalo(visualizacao, ref)
      if (!cacheRef.current.has(chaveIntervalo(intervalo.from, intervalo.to))) {
        prefetch(intervalo)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, visualizacao])

  const { execute: adicionarItem } = useAction(adicionarItemDiaAction, {
    onSuccess: ({ data, input }) => {
      if (!data) return
      setDias((atual) =>
        atual.map((d) =>
          d.data === input.data
            ? {
                ...d,
                diaId: data.diaId,
                alternativas: d.alternativas.map((a) =>
                  a.id === input.pratoCatalogoId && a.itemId.startsWith('temp-')
                    ? { ...a, itemId: data.itemId }
                    : a
                ),
              }
            : d
        )
      )
    },
    onError: ({ error, input }) => {
      toast.error(error.serverError ?? 'Não foi possível adicionar o prato')
      setDias((atual) =>
        atual.map((d) =>
          d.data === input.data
            ? {
                ...d,
                alternativas: d.alternativas.filter(
                  (a) =>
                    !(
                      a.id === input.pratoCatalogoId &&
                      a.itemId.startsWith('temp-')
                    )
                ),
              }
            : d
        )
      )
    },
  })

  const { execute: removerItem } = useAction(removerItemDiaAction, {
    onError: () => {
      toast.error('Não foi possível remover o prato')
      buscar({ from, to })
    },
  })

  const { execute: reordenar } = useAction(reordenarAlternativasAction, {
    onError: () => {
      toast.error('Não foi possível salvar a nova ordem')
      buscar({ from, to })
    },
  })

  const { execute: promoverDestaque } = useAction(promoverDestaqueAction, {
    onError: () => {
      toast.error('Não foi possível marcar o prato do dia')
      buscar({ from, to })
    },
  })

  const { execute: removerDestaque } = useAction(removerDestaqueAction, {
    onError: () => {
      toast.error('Não foi possível tirar o destaque')
      buscar({ from, to })
    },
  })

  const { execute: marcarEspecial } = useAction(marcarEspecialAction, {
    onError: () => {
      toast.error('Não foi possível marcar o prato como especial')
      buscar({ from, to })
    },
  })

  const { execute: fixarItem } = useAction(fixarItemAction, {
    onSuccess: () => toast.success('Prato fixado — repete nas próximas semanas'),
    onError: () => {
      toast.error('Não foi possível fixar o prato')
      buscar({ from, to })
    },
  })

  const { execute: desfixarItem } = useAction(desfixarItemAction, {
    onError: () => {
      toast.error('Não foi possível desfixar o prato')
      buscar({ from, to })
    },
  })

  // Distância mínima antes de ativar o drag — com o item inteiro arrastável
  // agora (não só o ícone de pontinhos), isso evita que um clique normal em
  // qualquer parte do card seja capturado como início de arraste.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  )

  function onDragStart(event: DragStartEvent) {
    const data = event.active.data.current as DragDataCatalogo | DragDataItem | undefined
    setArrastando(data?.type === 'catalogo' ? data : null)
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setArrastando(null)
    if (!over) return

    const activeData = active.data.current as
      | DragDataCatalogo
      | DragDataItem
      | undefined
    const overData = over.data.current as DropDataDia | DropDataItem | undefined
    if (!activeData) return

    if (activeData.type === 'catalogo') {
      const diaAlvo =
        overData?.type === 'dia' ? overData.data : (overData?.diaData ?? null)
      if (!diaAlvo) return

      const dia = dias.find((d) => d.data === diaAlvo)
      const jaTem =
        dia?.destaque?.id === activeData.pratoId ||
        dia?.alternativas.some((a) => a.id === activeData.pratoId)
      if (jaTem) {
        toast.error('Esse prato já está nesse dia')
        return
      }

      const tempId = `temp-${crypto.randomUUID()}`
      setDias((atual) => {
        const existe = atual.some((d) => d.data === diaAlvo)
        const novoItem = {
          id: activeData.pratoId,
          nome: activeData.nome,
          itemId: tempId,
          especial: false,
          fixo: false,
        }
        if (existe) {
          return atual.map((d) =>
            d.data === diaAlvo
              ? { ...d, alternativas: [...d.alternativas, novoItem] }
              : d
          )
        }
        return [
          ...atual,
          { diaId: null, data: diaAlvo, destaque: null, alternativas: [novoItem] },
        ].sort((a, b) => a.data.localeCompare(b.data))
      })

      adicionarItem({ data: diaAlvo, pratoCatalogoId: activeData.pratoId })
      return
    }

    if (activeData.type === 'item') {
      if (overData?.type !== 'item' || overData.diaData !== activeData.diaData)
        return
      if (active.id === over.id) return

      const dia = dias.find((d) => d.data === activeData.diaData)
      if (!dia?.diaId) return

      const ids = dia.alternativas.map((a) => a.itemId)
      const de = ids.indexOf(active.id as string)
      const para = ids.indexOf(over.id as string)
      if (de === -1 || para === -1) return

      const novaOrdem = arrayMove(dia.alternativas, de, para)
      setDias((atual) =>
        atual.map((d) =>
          d.data === dia.data ? { ...d, alternativas: novaOrdem } : d
        )
      )
      reordenar({
        diaId: dia.diaId,
        itemIds: novaOrdem.map((a) => a.itemId),
      })
    }
  }

  function onPromoverDestaque(diaData: string, diaId: string, itemId: string) {
    setDias((atual) =>
      atual.map((d) => {
        if (d.data !== diaData) return d
        const alvo = d.alternativas.find((a) => a.itemId === itemId)
        if (!alvo) return d
        const restante = d.alternativas.filter((a) => a.itemId !== itemId)
        const novasAlternativas = d.destaque
          ? [...restante, d.destaque]
          : restante
        return { ...d, destaque: alvo, alternativas: novasAlternativas }
      })
    )
    promoverDestaque({ diaId, itemId })
  }

  function onRemoverDestaque(diaData: string, diaId: string) {
    setDias((atual) =>
      atual.map((d) => {
        if (d.data !== diaData || !d.destaque) return d
        return {
          ...d,
          destaque: null,
          alternativas: [...d.alternativas, d.destaque],
        }
      })
    )
    const dia = dias.find((d) => d.data === diaData)
    if (dia?.destaque) removerDestaque({ diaId, itemId: dia.destaque.itemId })
  }

  function onToggleEspecial(diaData: string, itemId: string, especial: boolean) {
    setDias((atual) =>
      atual.map((d) => {
        if (d.data !== diaData) return d
        return {
          ...d,
          destaque:
            d.destaque?.itemId === itemId
              ? { ...d.destaque, especial }
              : d.destaque,
          alternativas: d.alternativas.map((a) =>
            a.itemId === itemId ? { ...a, especial } : a
          ),
        }
      })
    )
    marcarEspecial({ itemId, especial })
  }

  function onToggleFixo(diaData: string, itemId: string, fixo: boolean) {
    setDias((atual) =>
      atual.map((d) => {
        if (d.data !== diaData) return d
        return {
          ...d,
          destaque:
            d.destaque?.itemId === itemId ? { ...d.destaque, fixo } : d.destaque,
          alternativas: d.alternativas.map((a) =>
            a.itemId === itemId ? { ...a, fixo } : a
          ),
        }
      })
    )
    if (fixo) fixarItem({ itemId })
    else desfixarItem({ itemId })
  }

  function onRemoverItem(diaData: string, itemId: string) {
    setDias((atual) =>
      atual.map((d) =>
        d.data === diaData
          ? {
              ...d,
              alternativas: d.alternativas.filter((a) => a.itemId !== itemId),
            }
          : d
      )
    )
    removerItem({ itemId })
  }

  return (
    <>
      <SetHeaderContent center={<CardapioHeaderCenter />} />

      <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => setArrastando(null)}
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <PratosCatalogoList />
          <div className="lg:col-span-2">
            <CardapioCalendario
              visualizacao={visualizacao}
              onVisualizacaoChange={setVisualizacao}
              referencia={referencia}
              onReferenciaChange={setReferencia}
              dias={dias}
              carregando={carregando && !carregouUmaVez}
              atualizando={carregando && carregouUmaVez}
              onPromoverDestaque={onPromoverDestaque}
              onRemoverDestaque={onRemoverDestaque}
              onToggleEspecial={onToggleEspecial}
              onToggleFixo={onToggleFixo}
              onRemoverItem={onRemoverItem}
            />
          </div>
        </div>

        <DragOverlay>
          {arrastando ? (
            <div className="flex items-center gap-2 rounded-lg border bg-card px-2.5 py-2 shadow-lg">
              <UtensilsCrossed className="size-4 text-muted-foreground" />
              <span className="text-sm">{arrastando.nome}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </>
  )
}
