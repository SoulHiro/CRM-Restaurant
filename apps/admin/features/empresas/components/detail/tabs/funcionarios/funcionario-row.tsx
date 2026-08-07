'use client'

import { useState } from 'react'
import { Pencil, Power, PowerOff } from 'lucide-react'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'

import { Button } from '@repo/ui/components/button'
import { PersonAvatar } from '@repo/ui/components/person-avatar'
import { TableCell, TableRow } from '@repo/ui/components/table'

import { updateFuncionarioStatusAction } from '../../../../lib/actions'
import type { EmpresaFuncionario } from '../../../../lib/types'
import { AtivoInativoBadge } from '../../../shared/ativo-inativo-badge'
import { EditarFuncionarioDrawer } from '../../../form/editar-funcionario-drawer'

export function FuncionarioRow({
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
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <PersonAvatar
            name={funcionario.nome}
            className="size-8"
            fallbackClassName="text-xs font-medium"
          />
          <span className="font-medium">{funcionario.nome}</span>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {funcionario.setor}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {funcionario.turno}
      </TableCell>
      <TableCell>
        <AtivoInativoBadge active={isAtivo} />
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Editar dados"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={isAtivo ? 'Desativar vínculo' : 'Ativar vínculo'}
            disabled={isExecuting}
            onClick={() =>
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
          </Button>
        </div>
      </TableCell>

      <EditarFuncionarioDrawer
        empresaId={empresaId}
        funcionario={funcionario}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </TableRow>
  )
}
