'use client'

import { useRouter } from 'next/navigation'

import { PersonAvatar } from '@repo/ui/components/person-avatar'
import { cn } from '@repo/ui/lib/utils'

import type { EmpresaListItem } from '../../lib/types'
import { ListStatusBadge } from './list-status-badge'

export function EmpresaTableRow({
  empresa,
  className,
}: {
  empresa: EmpresaListItem
  className: string
}) {
  const router = useRouter()

  function goToEmpresa() {
    router.push(`/empresas/${empresa.id}`)
  }

  return (
    <div
      role="row"
      tabIndex={0}
      onClick={goToEmpresa}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          goToEmpresa()
        }
      }}
      className={cn(
        'cursor-pointer rounded-lg bg-card transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        className
      )}
    >
      <span role="cell" className="flex items-center gap-3">
        <PersonAvatar
          name={empresa.nome}
          className="size-9"
          fallbackClassName="text-xs font-medium"
        />
        <span className="flex flex-col">
          <span className="font-medium">{empresa.nome}</span>
          <span className="text-xs text-muted-foreground">{empresa.cnpj}</span>
        </span>
      </span>

      <span role="cell" className="truncate text-muted-foreground">
        {empresa.email}
      </span>

      <span role="cell" className="flex items-center gap-3">
        <PersonAvatar
          name={empresa.responsavelNome}
          className="size-9"
          fallbackClassName="text-xs font-medium"
        />
        <span className="flex flex-col">
          <span className="font-medium">{empresa.responsavelNome}</span>
          <span className="text-xs text-muted-foreground">
            {empresa.responsavelTelefone}
          </span>
        </span>
      </span>

      <span role="cell" className="flex flex-col items-center">
        <span className="font-medium tabular-nums">
          {empresa.funcionariosRespondidos}/{empresa.funcionariosTotal}
        </span>
        <ListStatusBadge status={empresa.status} showDot={false} />
      </span>
    </div>
  )
}
