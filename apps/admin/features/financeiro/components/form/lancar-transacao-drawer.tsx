'use client'

import { useState } from 'react'
import { Pencil, Plus } from 'lucide-react'

import { Button } from '@repo/ui/components/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@repo/ui/components/drawer'

import { useDrawerDirection } from '@/hooks/use-drawer-direction'
import type { Transacao } from '../../lib/types'
import { TransacaoForm } from './transacao-form'

export function LancarTransacaoDrawer({
  hoje,
  transacao,
}: {
  hoje: string
  transacao?: Transacao
}) {
  const [open, setOpen] = useState(false)
  const { direction, variant } = useDrawerDirection()
  const editando = transacao != null

  return (
    <Drawer direction={direction} open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        {editando ? (
          <Button variant="ghost" size="icon" aria-label="Editar lançamento">
            <Pencil className="size-4" />
          </Button>
        ) : (
          <Button size="sm" className="w-full sm:w-auto">
            <Plus className="size-4" />
            Novo lançamento
          </Button>
        )}
      </DrawerTrigger>
      <DrawerContent
        direction={direction}
        variant={variant}
        className="flex max-h-[85vh] w-full flex-col gap-0 overflow-y-auto sm:max-h-none sm:max-w-lg"
      >
        <DrawerHeader>
          <DrawerTitle>
            {editando ? 'Editar lançamento' : 'Novo lançamento'}
          </DrawerTitle>
          <DrawerDescription>
            Dinheiro que já entrou ou já saiu. O que ainda vai acontecer entra
            em &ldquo;A pagar&rdquo; ou &ldquo;A receber&rdquo;.
          </DrawerDescription>
        </DrawerHeader>

        <TransacaoForm
          transacao={transacao}
          hoje={hoje}
          open={open}
          onOpenChange={setOpen}
        />
      </DrawerContent>
    </Drawer>
  )
}
