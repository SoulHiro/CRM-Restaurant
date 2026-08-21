'use client'

import { useMemo, useState } from 'react'

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@repo/ui/components/command'
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@repo/ui/components/popover'

import type { ColaboradorOption } from '../lib/types'

/**
 * Só nomes já cadastrados — sem opção de "criar novo" aqui de propósito
 * (ver contexto do plano: sem curadoria, isso abriria porta pra nome
 * duplicado/errado direto na tabela real).
 */
export function ColaboradorPicker({
  colaboradores,
  onSelecionar,
}: {
  colaboradores: ColaboradorOption[]
  onSelecionar: (colaborador: ColaboradorOption) => void
}) {
  const [busca, setBusca] = useState('')
  const [open, setOpen] = useState(false)

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return colaboradores
    return colaboradores.filter((c) => c.nome.toLowerCase().includes(termo))
  }, [colaboradores, busca])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Command shouldFilter={false} className="overflow-visible bg-transparent">
        <PopoverAnchor asChild>
          <CommandInput
            value={busca}
            onValueChange={(valor) => {
              setBusca(valor)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            placeholder="Digite seu nome..."
            wrapperClassName="h-11 rounded-md border border-input shadow-sm"
          />
        </PopoverAnchor>

        <PopoverContent
          className="w-(--radix-popover-trigger-width) p-0"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <CommandList>
            <CommandEmpty>
              Nenhum nome encontrado — confira a grafia ou fale com o RH.
            </CommandEmpty>
            <CommandGroup>
              {filtrados.map((c) => (
                <CommandItem
                  key={c.id}
                  value={c.id}
                  onSelect={() => {
                    onSelecionar(c)
                    setBusca(c.nome)
                    setOpen(false)
                  }}
                >
                  {c.nome}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </PopoverContent>
      </Command>
    </Popover>
  )
}
