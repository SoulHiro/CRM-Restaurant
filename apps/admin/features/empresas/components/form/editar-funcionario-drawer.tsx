'use client'

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@repo/ui/components/drawer'

import type { EmpresaFuncionario } from '../../lib/types'
import { FuncionarioForm } from './funcionario-form'

export function EditarFuncionarioDrawer({
  empresaId,
  funcionario,
  open,
  onOpenChange,
}: {
  empresaId: string
  funcionario: EmpresaFuncionario
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Drawer direction="right" open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        direction="right"
        variant="float"
        className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-lg"
      >
        <DrawerHeader>
          <DrawerTitle>Editar funcionário</DrawerTitle>
          <DrawerDescription>
            Atualize os dados de vínculo desse funcionário com a empresa.
          </DrawerDescription>
        </DrawerHeader>

        <FuncionarioForm
          empresaId={empresaId}
          funcionario={funcionario}
          open={open}
          onOpenChange={onOpenChange}
        />
      </DrawerContent>
    </Drawer>
  )
}
