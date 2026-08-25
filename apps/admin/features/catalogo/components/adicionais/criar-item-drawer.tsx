'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
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
import { criarAdicionalItemAction } from '../../lib/actions'

const VALORES_INICIAIS = {
  nome: '',
  preco: 0,
  fotoUrl: '',
  quantidadeMinima: 0,
  quantidadeMaxima: 1,
}

export function CriarItemDrawer({ grupoId }: { grupoId: string }) {
  const [open, setOpen] = useState(false)
  const [valores, setValores] = useState(VALORES_INICIAIS)
  const { direction, variant } = useDrawerDirection()

  const { execute, isExecuting } = useAction(criarAdicionalItemAction, {
    onSuccess: () => {
      toast.success('Item cadastrado')
      setOpen(false)
      setValores(VALORES_INICIAIS)
    },
    onError: ({ error }) =>
      toast.error(error.serverError ?? 'Não foi possível cadastrar o item'),
  })

  const podeSalvar = valores.nome.trim().length > 0

  return (
    <Drawer direction={direction} open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button size="sm" className="w-full sm:w-auto">
          <Plus className="size-4" />
          Novo item
        </Button>
      </DrawerTrigger>
      <DrawerContent
        direction={direction}
        variant={variant}
        className="flex w-full flex-col gap-0 overflow-y-auto sm:max-h-none sm:max-w-lg"
      >
        <DrawerHeader>
          <DrawerTitle>Novo item</DrawerTitle>
          <DrawerDescription>
            Entra no grupo pra qualquer produto que já use esse grupo.
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-1 flex-col gap-4 px-4 py-6">
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Nome</Label>
            <Input
              value={valores.nome}
              onChange={(e) =>
                setValores((v) => ({ ...v, nome: e.target.value }))
              }
              placeholder="Ex: Bacon extra"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Preço</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={valores.preco}
              onChange={(e) =>
                setValores((v) => ({ ...v, preco: Number(e.target.value) }))
              }
              className="max-w-48"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">URL da foto (opcional)</Label>
            <Input
              value={valores.fotoUrl}
              onChange={(e) =>
                setValores((v) => ({ ...v, fotoUrl: e.target.value }))
              }
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Quantidade mínima</Label>
              <Input
                type="number"
                min={0}
                step="1"
                value={valores.quantidadeMinima}
                onChange={(e) =>
                  setValores((v) => ({
                    ...v,
                    quantidadeMinima: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Quantidade máxima</Label>
              <Input
                type="number"
                min={1}
                step="1"
                value={valores.quantidadeMaxima}
                onChange={(e) =>
                  setValores((v) => ({
                    ...v,
                    quantidadeMaxima: Number(e.target.value),
                  }))
                }
              />
            </div>
          </div>
        </div>

        <DrawerFooter>
          <Button
            disabled={!podeSalvar || isExecuting}
            onClick={() => execute({ grupoId, ...valores })}
          >
            {isExecuting ? 'Salvando...' : 'Cadastrar item'}
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
