'use client'

import { useState } from 'react'
import { TrendingDown } from 'lucide-react'

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
import { RegistrarPerdaForm } from './registrar-perda-form'

export function RegistrarPerdaDrawer({
  item,
  hoje,
  variant: buttonVariant = 'outline',
}: {
  item: EstoqueItem
  hoje: string
  variant?: 'outline' | 'ghost'
}) {
  const [open, setOpen] = useState(false)
  const { direction, variant } = useDrawerDirection()

  return (
    <Drawer direction={direction} open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant={buttonVariant} size="sm" className="w-full sm:w-auto">
          <TrendingDown className="size-4" />
          Registrar perda
        </Button>
      </DrawerTrigger>
      <DrawerContent
        direction={direction}
        variant={variant}
        className="flex max-h-[85vh] w-full flex-col gap-0 overflow-y-auto sm:max-h-none sm:max-w-lg"
      >
        <DrawerHeader>
          <DrawerTitle>Perda de {item.nome}</DrawerTitle>
          <DrawerDescription>
            Sai da quantidade em estoque e fica registrado no histórico do
            item.
          </DrawerDescription>
        </DrawerHeader>

        <RegistrarPerdaForm
          item={item}
          hoje={hoje}
          open={open}
          onOpenChange={setOpen}
        />
      </DrawerContent>
    </Drawer>
  )
}
