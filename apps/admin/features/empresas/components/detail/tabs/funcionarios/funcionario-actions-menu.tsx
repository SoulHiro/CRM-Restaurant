'use client'

import { useState } from 'react'
import {
  ClipboardList,
  MoreHorizontal,
  Pencil,
  Power,
  PowerOff,
} from 'lucide-react'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'

import { Button } from '@repo/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/components/dropdown-menu'

import { updateFuncionarioStatusAction } from '../../../../lib/actions'
import type { EmpresaFuncionario } from '../../../../lib/types'
import { EditarFuncionarioDrawer } from '../../../form/editar-funcionario-drawer'

export function FuncionarioActionsMenu({
  empresaId,
  funcionario,
}: {
  empresaId: string
  funcionario: EmpresaFuncionario
}) {
  const [editOpen, setEditOpen] = useState(false)
  const isAtivo = funcionario.vinculoStatus === 'ativo'

  const { execute: updateStatus, isExecuting } = useAction(
    updateFuncionarioStatusAction,
    {
      onSuccess: () => {
        toast.success(isAtivo ? 'Vínculo desativado' : 'Vínculo ativado')
      },
      onError: () => {
        toast.error('Não foi possível alterar o status do vínculo')
      },
    }
  )

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Ações">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <Pencil className="size-4" />
            Editar dados
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() =>
              toast.info(
                'Ainda não é possível listar pedidos por funcionário — os envios não guardam essa relação hoje.'
              )
            }
          >
            <ClipboardList className="size-4" />
            Ver pedidos/respostas
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={isExecuting}
            onSelect={() =>
              updateStatus({
                id: funcionario.id,
                status: isAtivo ? 'inativo' : 'ativo',
              })
            }
          >
            {isAtivo ? (
              <PowerOff className="size-4" />
            ) : (
              <Power className="size-4" />
            )}
            {isAtivo ? 'Desativar vínculo' : 'Ativar vínculo'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditarFuncionarioDrawer
        empresaId={empresaId}
        funcionario={funcionario}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  )
}
