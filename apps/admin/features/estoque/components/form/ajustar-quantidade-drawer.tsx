'use client'

import { useState } from 'react'
import { Scale } from 'lucide-react'

import { Button } from '@repo/ui/components/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@repo/ui/components/drawer'

import { useDrawerDirection } from '../../hooks/use-drawer-direction'
import type { EstoqueItem } from '../../lib/types'
import { AjustarQuantidadeForm } from './ajustar-quantidade-form'

export function AjustarQuantidadeDrawer({ item }: { item: EstoqueItem }) {
  const [open, setOpen] = useState(false)
  const { direction, variant } = useDrawerDirection()

  return (
    <Drawer direction={direction} open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button size="sm" className="w-full sm:w-auto">
          <Scale className="size-4" />
          Ajustar quantidade
        </Button>
      </DrawerTrigger>
      <DrawerContent
        direction={direction}
        variant={variant}
        className="flex max-h-[85vh] w-full flex-col gap-0 overflow-y-auto sm:max-h-none sm:max-w-lg"
      >
        <DrawerHeader>
          <DrawerTitle>Ajustar quantidade de {item.nome}</DrawerTitle>
          <DrawerDescription>
            Só o número — pra corrigir rápido, sem mexer no resto do cadastro.
          </DrawerDescription>
        </DrawerHeader>

        <AjustarQuantidadeForm item={item} open={open} onOpenChange={setOpen} />
      </DrawerContent>
    </Drawer>
  )
}
