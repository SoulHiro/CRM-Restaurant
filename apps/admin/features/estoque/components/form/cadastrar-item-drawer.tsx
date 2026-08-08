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

import { useDrawerDirection } from '@/hooks/use-drawer-direction'
import { EstoqueItemForm } from './estoque-item-form'

export function CadastrarItemDrawer() {
  const [open, setOpen] = useState(false)
  const { direction, variant } = useDrawerDirection()

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
        className="flex max-h-[85vh] w-full flex-col gap-0 overflow-y-auto sm:max-h-none sm:max-w-lg"
      >
        <DrawerHeader>
          <DrawerTitle>Novo item de estoque</DrawerTitle>
          <DrawerDescription>
            A quantidade inicial já entra no histórico como ajuste manual.
          </DrawerDescription>
        </DrawerHeader>

        <EstoqueItemForm open={open} onOpenChange={setOpen} />
      </DrawerContent>
    </Drawer>
  )
}
