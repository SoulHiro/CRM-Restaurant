'use client'

import Link from 'next/link'
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

import { salvarLayoutResumoAction } from '../lib/actions'
import type { CampoResumoKey } from '../lib/types'
import { ResumoCampoRow } from './resumo-campo-row'

export function ResumoDoDiaTab({
  ordem,
  setOrdem,
  ativos,
  onToggle,
  campos,
}: {
  ordem: CampoResumoKey[]
  setOrdem: (atualizar: (atual: CampoResumoKey[]) => CampoResumoKey[]) => void
  ativos: Set<CampoResumoKey>
  onToggle: (campo: CampoResumoKey) => void
  campos: CampoResumoKey[]
}) {
  const sensors = useSensors(useSensor(PointerSensor))

  const { execute, isExecuting } = useAction(salvarLayoutResumoAction, {
    onSuccess: () => toast.success('Layout do resumo do dia salvo'),
    onError: () => toast.error('Não foi possível salvar o layout'),
  })

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setOrdem((atual) => {
      const de = atual.indexOf(active.id as CampoResumoKey)
      const para = atual.indexOf(over.id as CampoResumoKey)
      if (de === -1 || para === -1) return atual
      return arrayMove(atual, de, para)
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-muted-foreground">
        Escolhe quais linhas aparecem no cabeçalho da nota de fechamento do
        dia e em que ordem — os dados em si (nome, endereço, CNPJ, I.E.) vêm
        de{' '}
        <Link
          href="/configuracoes/dados-empresa"
          className="underline underline-offset-2"
        >
          Dados da empresa
        </Link>
        . Café/suco/lanche e os pedidos do dia são lançados na hora, no
        próprio &quot;Finalizar dia&quot;.
      </p>

      <div className="flex flex-col gap-1.5">
        <Label className="text-sm">
          Linhas do cabeçalho — arraste pelos pontinhos pra reordenar
        </Label>
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <SortableContext items={ordem} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2">
              {ordem.map((campo) => (
                <ResumoCampoRow
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
        onClick={() => execute({ campos })}
      >
        {isExecuting ? 'Salvando...' : 'Salvar layout'}
      </Button>
    </div>
  )
}
