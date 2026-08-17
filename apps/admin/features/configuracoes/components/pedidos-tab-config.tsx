'use client'

import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'

import { Button } from '@repo/ui/components/button'
import { Label } from '@repo/ui/components/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select'

import { salvarConfiguracaoComandaAction } from '../lib/actions'
import type { CampoComandaKey, ImpressoraOption } from '../lib/types'
import { ComandaCampoRow } from './comanda-campo-row'

const SEM_IMPRESSORA = '__nenhuma__'

export function PedidosTabConfig({
  ordem,
  setOrdem,
  ativos,
  onToggle,
  campos,
  impressoraId,
  setImpressoraId,
  impressoras,
}: {
  ordem: CampoComandaKey[]
  setOrdem: (atualizar: (atual: CampoComandaKey[]) => CampoComandaKey[]) => void
  ativos: Set<CampoComandaKey>
  onToggle: (campo: CampoComandaKey) => void
  campos: CampoComandaKey[]
  impressoraId: string | null
  setImpressoraId: (id: string | null) => void
  impressoras: ImpressoraOption[]
}) {
  const sensors = useSensors(useSensor(PointerSensor))

  const { execute, isExecuting } = useAction(salvarConfiguracaoComandaAction, {
    onSuccess: () => toast.success('Layout da comanda salvo'),
    onError: () => toast.error('Não foi possível salvar o layout'),
  })

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setOrdem((atual) => {
      const de = atual.indexOf(active.id as CampoComandaKey)
      const para = atual.indexOf(over.id as CampoComandaKey)
      if (de === -1 || para === -1) return atual
      return arrayMove(atual, de, para)
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label className="text-sm">Impressora dos pedidos</Label>
        <Select
          value={impressoraId ?? SEM_IMPRESSORA}
          onValueChange={(v) => setImpressoraId(v === SEM_IMPRESSORA ? null : v)}
        >
          <SelectTrigger className="w-full sm:w-72">
            <SelectValue placeholder="Nenhuma impressora selecionada" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={SEM_IMPRESSORA}>
              Nenhuma (usa a primeira comanda ativa)
            </SelectItem>
            {impressoras.map((impressora) => (
              <SelectItem key={impressora.id} value={impressora.id}>
                {impressora.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {impressoras.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Nenhuma impressora cadastrada ainda — veja a aba Impressoras.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-sm">
          Campos abaixo do nome — arraste pelos pontinhos pra reordenar
        </Label>
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <SortableContext items={ordem} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2">
              {ordem.map((campo) => (
                <ComandaCampoRow
                  key={campo}
                  campo={campo}
                  ativo={ativos.has(campo)}
                  onToggle={() => onToggle(campo)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <Button
        className="self-start"
        disabled={isExecuting}
        onClick={() => execute({ campos, impressoraId })}
      >
        {isExecuting ? 'Salvando...' : 'Salvar layout'}
      </Button>
    </div>
  )
}
