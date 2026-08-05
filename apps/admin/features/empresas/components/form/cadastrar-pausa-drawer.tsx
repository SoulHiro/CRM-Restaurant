'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'

import { Button } from '@repo/ui/components/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@repo/ui/components/drawer'

import { CadastrarPausaForm } from './cadastrar-pausa-form'

export function CadastrarPausaDrawer({ empresaId }: { empresaId: string }) {
  const [open, setOpen] = useState(false)

  return (
    <Drawer direction="right" open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          Nova pausa
        </Button>
      </DrawerTrigger>
      <DrawerContent
        direction="right"
        variant="float"
        className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-lg"
      >
        <DrawerHeader>
          <DrawerTitle>Nova pausa</DrawerTitle>
          <DrawerDescription>
            Registra um dia sem envio de pedidos para essa empresa.
          </DrawerDescription>
        </DrawerHeader>

        <CadastrarPausaForm
          empresaId={empresaId}
          open={open}
          onOpenChange={setOpen}
        />
      </DrawerContent>
    </Drawer>
  )
}
