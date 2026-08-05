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

import { FuncionarioForm } from './funcionario-form'

export function CadastrarFuncionarioDrawer({
  empresaId,
}: {
  empresaId: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <Drawer direction="right" open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Novo
        </Button>
      </DrawerTrigger>
      <DrawerContent
        direction="right"
        variant="float"
        className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-lg"
      >
        <DrawerHeader>
          <DrawerTitle>Novo funcionário</DrawerTitle>
          <DrawerDescription>
            O funcionário é vinculado automaticamente a essa empresa.
          </DrawerDescription>
        </DrawerHeader>

        <FuncionarioForm
          empresaId={empresaId}
          open={open}
          onOpenChange={setOpen}
        />
      </DrawerContent>
    </Drawer>
  )
}
