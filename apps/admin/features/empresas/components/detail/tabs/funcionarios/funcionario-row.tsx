import { Check, X } from 'lucide-react'

import { PersonAvatar } from '@repo/ui/components/person-avatar'
import { cn } from '@repo/ui/lib/utils'

import type { EmpresaFuncionario } from '../../../../lib/types'
import { AtivoInativoBadge } from '../../../shared/ativo-inativo-badge'
import { FuncionarioActionsMenu } from './funcionario-actions-menu'

export function FuncionarioRow({
  empresaId,
  funcionario,
  className,
}: {
  empresaId: string
  funcionario: EmpresaFuncionario
  className: string
}) {
  return (
    <div role="row" className={cn('rounded-lg bg-card', className)}>
      <span role="cell" className="flex items-center gap-3">
        <PersonAvatar
          name={funcionario.nome}
          className="size-8"
          fallbackClassName="text-xs font-medium"
        />
        <span className="font-medium">{funcionario.nome}</span>
      </span>

      <span role="cell" className="text-muted-foreground">
        {funcionario.setor}
      </span>

      <span role="cell" className="text-muted-foreground">
        {funcionario.turno}
      </span>

      <span role="cell">
        <AtivoInativoBadge active={funcionario.vinculoStatus === 'ativo'} />
      </span>

      <span role="cell" className="flex justify-center">
        {funcionario.respondeuEstaSemana ? (
          <Check className="size-4 text-sidebar" />
        ) : (
          <X className="size-4 text-muted-foreground" />
        )}
      </span>

      <span role="cell" className="flex justify-end">
        <FuncionarioActionsMenu
          empresaId={empresaId}
          funcionario={funcionario}
        />
      </span>
    </div>
  )
}
