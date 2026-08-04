import { ListFilter, ArrowUpDown, Search } from "lucide-react"

import { Button } from "@repo/ui/components/button"
import { Input } from "@repo/ui/components/input"
import { cn } from "@repo/ui/lib/utils"

import { CadastrarEmpresaDrawer } from "./cadastrar-empresa-drawer"
import { EmpresaRow } from "./empresa-row"
import { mockEmpresas } from "./mock-empresas"

const GRID_COLUMNS = "grid-cols-[2fr_1.6fr_1.6fr_0.8fr]"

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

        <CadastrarEmpresaDrawer />
      </div>

      <div role="table" aria-label="Empresas cadastradas" className="flex flex-col gap-2">
        <div
          role="row"
          className={cn(
            "grid items-center gap-4 px-4 py-3 text-xs font-medium text-muted-foreground",
            GRID_COLUMNS
          )}
        >
          <span role="columnheader">Empresa</span>
          <span role="columnheader">E-mail</span>
          <span role="columnheader">Responsável</span>
          <span role="columnheader" className="text-center">
            Funcionários
          </span>
        </div>

        {mockEmpresas.map((empresa) => (
          <EmpresaRow
            key={empresa.id}
            empresa={empresa}
            className={cn("grid items-center gap-4 px-4 py-3", GRID_COLUMNS)}
          />
        ))}
      </div>
    </div>
  )
}
