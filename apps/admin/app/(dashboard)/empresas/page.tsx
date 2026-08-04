import { ListFilter, ArrowUpDown, Search } from "lucide-react"

import { Button } from "@repo/ui/components/button"
import { Input } from "@repo/ui/components/input"
import { cn } from "@repo/ui/lib/utils"

import { CadastrarEmpresaSheet } from "./cadastrar-empresa-sheet"
import { mockEmpresas } from "./mock-empresas"
import { StatusIndicator } from "./status-indicator"

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
})

const GRID_COLUMNS = "grid-cols-[2fr_1.2fr_1fr_0.8fr_1.3fr]"

export default function EmpresasPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Empresas</h1>
        <p className="text-sm text-muted-foreground">
          Empresas clientes cadastradas e o andamento dos pedidos da semana.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="relative w-72">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar empresa..."
              className="pl-8"
            />
          </div>
          <Button variant="outline" size="icon" aria-label="Filtrar">
            <ListFilter className="size-4" />
          </Button>
          <Button variant="outline" size="icon" aria-label="Ordenar">
            <ArrowUpDown className="size-4" />
          </Button>
        </div>

        <CadastrarEmpresaSheet />
      </div>

      <div role="table" aria-label="Empresas cadastradas" className="flex flex-col gap-2">
        <div
          role="row"
          className={cn(
            "grid items-center gap-4 px-4 pb-1 text-xs font-medium text-muted-foreground",
            GRID_COLUMNS
          )}
        >
          <span role="columnheader">Empresa</span>
          <span role="columnheader">CNPJ</span>
          <span role="columnheader">Cadastrada em</span>
          <span role="columnheader" className="text-right">
            Funcionários
          </span>
          <span role="columnheader">Status</span>
        </div>

        {mockEmpresas.map((empresa) => (
          <div
            key={empresa.id}
            role="row"
            className={cn(
              "grid items-center gap-4 rounded-lg border bg-card px-4 py-5 transition-colors hover:border-foreground/20",
              GRID_COLUMNS
            )}
          >
            <span role="cell" className="font-medium">
              {empresa.nome}
            </span>
            <span role="cell" className="text-muted-foreground">
              {empresa.cnpj}
            </span>
            <span role="cell" className="text-muted-foreground">
              {dateFormatter.format(new Date(empresa.cadastradaEm))}
            </span>
            <span role="cell" className="text-right tabular-nums">
              {empresa.funcionarios}
            </span>
            <span role="cell">
              <StatusIndicator status={empresa.status} />
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
