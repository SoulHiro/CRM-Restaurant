import Link from 'next/link'
import { ArrowLeft, Pencil } from 'lucide-react'

import { Button } from '@repo/ui/components/button'
import { PersonAvatar } from '@repo/ui/components/person-avatar'

import type { EmpresaListItem, EmpresaRecordStatus } from '../../lib/types'
import { AtivoInativoBadge } from '../shared/ativo-inativo-badge'

export function EmpresaHeader({
  empresa,
  status,
}: {
  empresa: EmpresaListItem
  status: EmpresaRecordStatus
}) {
  return (
    <div className="flex w-full flex-col gap-4">
      <Button variant="ghost" size="icon" aria-label="Voltar" asChild>
        <Link href="/empresas">
          <ArrowLeft className="size-4" />
        </Link>
      </Button>

      <div className="flex items-center justify-between gap-6 rounded-xl bg-sidebar p-6">
        <div className="group flex items-center gap-4">
          <PersonAvatar
            name={empresa.nome}
            className="size-16"
            fallbackClassName="bg-sidebar-accent text-lg font-medium text-sidebar-accent-foreground"
          />
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-sidebar-foreground">
                {empresa.nome}
              </h1>
              <AtivoInativoBadge active={status === 'ativo'} />
            </div>
            <p className="text-sm text-sidebar-foreground/70">{empresa.cnpj}</p>
            <p className="text-sm text-sidebar-foreground/70">
              {empresa.email}
            </p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            aria-label="Editar empresa"
            className="rounded-full text-sidebar-foreground opacity-0 transition-opacity hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-hover:opacity-100"
          >
            <Pencil className="size-4" />
          </Button>
        </div>

        <div className="flex flex-col items-end gap-1 self-end">
          <span className="text-[10px] font-medium uppercase tracking-wide text-sidebar-foreground/50">
            Responsável
          </span>
          <div className="flex items-center gap-3">
            <PersonAvatar
              name={empresa.responsavelNome}
              className="size-9"
              fallbackClassName="bg-sidebar-accent text-xs font-medium text-sidebar-accent-foreground"
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-sidebar-foreground">
                {empresa.responsavelNome}
              </span>
              <span className="text-xs text-sidebar-foreground/70">
                {empresa.responsavelTelefone}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
