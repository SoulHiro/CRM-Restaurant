"use client"

import { useRouter } from "next/navigation"

import { Avatar, AvatarFallback } from "@repo/ui/components/avatar"
import { cn, getInitials } from "@repo/ui/lib/utils"

import type { EmpresaRow as EmpresaRowData } from "./mock-empresas"
import { StatusIndicator } from "./status-indicator"

export function EmpresaRow({
  empresa,
  className,
}: {
  empresa: EmpresaRowData
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
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          goToEmpresa()
        }
      }}
      className={cn(
        "cursor-pointer rounded-lg bg-card transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        className
      )}
    >
      <span role="cell" className="flex items-center gap-3">
        <Avatar className="size-9">
          <AvatarFallback className="text-xs font-medium">
            {getInitials(empresa.nome)}
          </AvatarFallback>
        </Avatar>
        <span className="flex flex-col">
          <span className="font-medium">{empresa.nome}</span>
          <span className="text-xs text-muted-foreground">
            {empresa.cnpj}
          </span>
        </span>
      </span>

      <span role="cell" className="truncate text-muted-foreground">
        {empresa.email}
      </span>

      <span role="cell" className="flex items-center gap-3">
        <Avatar className="size-9">
          <AvatarFallback className="text-xs font-medium">
            {getInitials(empresa.responsavelNome)}
          </AvatarFallback>
        </Avatar>
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
        <StatusIndicator status={empresa.status} showDot={false} />
      </span>
    </div>
  )
}
