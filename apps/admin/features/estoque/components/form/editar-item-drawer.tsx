'use client'

import { useState } from 'react'
import { Pencil } from 'lucide-react'

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
import type { EstoqueItem } from '../../lib/types'
import { EstoqueItemForm } from './estoque-item-form'

export function EditarItemDrawer({ item }: { item: EstoqueItem }) {
  const [open, setOpen] = useState(false)
  const { direction, variant } = useDrawerDirection()

  return (
    <Drawer direction={direction} open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm" className="w-full sm:w-auto">
          <Pencil className="size-4" />
          Editar
        </Button>
      </DrawerTrigger>
      <DrawerContent
        direction={direction}
        variant={variant}
        className="flex max-h-[85vh] w-full flex-col gap-0 overflow-y-auto sm:max-h-none sm:max-w-lg"
      >
        <DrawerHeader>
          <DrawerTitle>Editar {item.nome}</DrawerTitle>
          <DrawerDescription>
            Nome, unidade, embalagem, reposição, validade e preço. Quantidade
            em estoque não mexe aqui — use &ldquo;Ajustar quantidade&rdquo;.
          </DrawerDescription>
        </DrawerHeader>

        <EstoqueItemForm item={item} open={open} onOpenChange={setOpen} />
      </DrawerContent>
    </Drawer>
  )
}
