'use client'

import { Search } from 'lucide-react'

import { Input } from '@repo/ui/components/input'

// Filtro local e síncrono sobre um array pequeno já carregado — sem o
// debounce/URL-sync de funcionarios-search-input.tsx, que existem ali pra
// limitar chamadas de router.push, algo que não se aplica aqui.
export function HistoricoSearchInput({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="relative w-72">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Buscar funcionário..."
        className="pl-8"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
