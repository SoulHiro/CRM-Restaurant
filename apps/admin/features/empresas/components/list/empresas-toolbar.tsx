import { ArrowUpDown, ListFilter, Search } from 'lucide-react'

import { Button } from '@repo/ui/components/button'
import { Input } from '@repo/ui/components/input'

import { CadastrarEmpresaDrawer } from '../form/cadastrar-empresa-drawer'

export function EmpresasToolbar({ podeCadastrar }: { podeCadastrar: boolean }) {
  return (
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

      {podeCadastrar && <CadastrarEmpresaDrawer />}
    </div>
  )
}
