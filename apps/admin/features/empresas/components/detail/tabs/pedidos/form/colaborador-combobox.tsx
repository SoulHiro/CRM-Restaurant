'use client'

import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'

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

export interface ColaboradorOption {
  id: string
  nome: string
}

/**
 * Busca com autocomplete — digitar já filtra a lista (setas + enter
 * navegam, cmdk cuida disso sozinho). Quando nada bate com o texto
 * digitado, o único item da lista vira "Adicionar colaborador", no mesmo
 * formato de um item normal: clicar cria a pessoa, não clicar não cria
 * nada — não existe um passo de "confirmar criação" separado.
 */
export function ColaboradorCombobox({
  colaboradores,
  busca,
  onBuscaChange,
  onSelecionar,
  onCriarNovo,
  placeholder = 'Buscar colaborador...',
}: {
  colaboradores: ColaboradorOption[]
  busca: string
  onBuscaChange: (valor: string) => void
  onSelecionar: (colaborador: ColaboradorOption) => void
  onCriarNovo: (nome: string) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return colaboradores
    return colaboradores.filter((c) => c.nome.toLowerCase().includes(termo))
  }, [colaboradores, busca])

  const semCorrespondencia = busca.trim() !== '' && filtrados.length === 0

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Command shouldFilter={false} className="overflow-visible bg-transparent">
        <PopoverAnchor asChild>
          <CommandInput
            value={busca}
            onValueChange={(valor) => {
              onBuscaChange(valor)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            wrapperClassName="h-9 rounded-md border border-input shadow-sm"
          />
        </PopoverAnchor>

        <PopoverContent
          className="w-(--radix-popover-trigger-width) p-0"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <CommandList>
            {semCorrespondencia ? (
              <CommandGroup>
                <CommandItem
                  value={`__novo__${busca}`}
                  onSelect={() => {
                    onCriarNovo(busca.trim())
                    setOpen(false)
                  }}
                >
                  <Plus className="size-4" />
                  Adicionar colaborador &quot;{busca.trim()}&quot;
                </CommandItem>
              </CommandGroup>
            ) : (
              <>
                <CommandEmpty>Nenhum colaborador cadastrado ainda.</CommandEmpty>
                <CommandGroup>
                  {filtrados.map((c) => (
                    <CommandItem
                      key={c.id}
                      value={c.id}
                      onSelect={() => {
                        onSelecionar(c)
                        setOpen(false)
                      }}
                    >
                      {c.nome}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </PopoverContent>
      </Command>
    </Popover>
  )
}
