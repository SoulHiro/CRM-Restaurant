'use client'

import { useState } from 'react'
import { Moon, Plus, Sun } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'

import { Button } from '@repo/ui/components/button'
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

import { useDrawerDirection } from '@/hooks/use-drawer-direction'
import { criarGrupoAdicionalAction } from '../../lib/actions'
import type { GrupoAdicionalOption } from '../../lib/types'
import { SelectableCard } from '../shared/selectable-card'

export function CriarGrupoDrawer({
  onCriado,
}: {
  /** Quando informado, não navega — devolve o grupo pronto pra uso imediato (ex: seleção no formulário de produto). */
  onCriado?: (grupo: GrupoAdicionalOption) => void
} = {}) {
  const [open, setOpen] = useState(false)
  const [nome, setNome] = useState('')
  const [disponivelAlmoco, setDisponivelAlmoco] = useState(true)
  const [disponivelJanta, setDisponivelJanta] = useState(true)
  const { direction, variant } = useDrawerDirection()
  const router = useRouter()

  const { execute, isExecuting } = useAction(criarGrupoAdicionalAction, {
    onSuccess: ({ data }) => {
      if (!data) return
      toast.success('Grupo criado')
      setOpen(false)
      if (onCriado) {
        onCriado({
          id: data.grupoId,
          nome: nome.trim(),
          disponivelAlmoco,
          disponivelJanta,
          ativo: true,
          itens: [],
        })
      } else {
        router.push(`/catalogo/adicionais/${data.grupoId}`)
      }
      setNome('')
      setDisponivelAlmoco(true)
      setDisponivelJanta(true)
    },
    onError: () => toast.error('Não foi possível criar o grupo'),
  })

  const podeSalvar = nome.trim().length > 0 && (disponivelAlmoco || disponivelJanta)

  return (
    <Drawer direction={direction} open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button size="sm" className="w-full sm:w-auto">
          <Plus className="size-4" />
          Novo grupo
        </Button>
      </DrawerTrigger>
      <DrawerContent
        direction={direction}
        variant={variant}
        className="flex w-full flex-col gap-0 overflow-y-auto sm:max-h-none sm:max-w-lg"
      >
        <DrawerHeader>
          <DrawerTitle>Novo grupo de adicionais</DrawerTitle>
          <DrawerDescription>
            Os itens entram depois, na tela do grupo.
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-1 flex-col gap-4 px-4 py-6">
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Nome do grupo</Label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Molhos, Bacon e queijos"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Disponível em</Label>
            <div className="grid grid-cols-2 gap-3">
              <SelectableCard
                icon={Sun}
                label="Almoço"
                selected={disponivelAlmoco}
                onClick={() => setDisponivelAlmoco((v) => !v)}
              />
              <SelectableCard
                icon={Moon}
                label="Janta"
                selected={disponivelJanta}
                onClick={() => setDisponivelJanta((v) => !v)}
              />
            </div>
          </div>
        </div>

        <DrawerFooter>
          <Button
            disabled={!podeSalvar || isExecuting}
            onClick={() =>
              execute({ nome: nome.trim(), disponivelAlmoco, disponivelJanta })
            }
          >
            {isExecuting ? 'Criando...' : 'Criar grupo'}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setOpen(false)}
          >
            Cancelar
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
