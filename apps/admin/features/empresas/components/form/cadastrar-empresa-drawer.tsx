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

import { CadastrarEmpresaForm } from './cadastrar-empresa-form'

export function CadastrarEmpresaDrawer() {
  const [open, setOpen] = useState(false)

  return (
    <Drawer direction="right" open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Cadastrar empresa
        </Button>
      </DrawerTrigger>
      <DrawerContent
        direction="right"
        variant="float"
        className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-lg"
      >
        <DrawerHeader>
          <DrawerTitle>Cadastrar empresa</DrawerTitle>
          <DrawerDescription>
            Preencha os dados da empresa cliente. Só nome, CNPJ e status são
            obrigatórios.
          </DrawerDescription>
        </DrawerHeader>

        <CadastrarEmpresaForm open={open} onOpenChange={setOpen} />
      </DrawerContent>
    </Drawer>
  )
}
