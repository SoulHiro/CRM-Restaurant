'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'

import { Button } from '@repo/ui/components/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@repo/ui/components/command'
import { Input } from '@repo/ui/components/input'
import { Label } from '@repo/ui/components/label'
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@repo/ui/components/popover'

import { formatCurrencyBRL } from '@/lib/formatters'
import { CATEGORIA_ESTOQUE_LABEL } from '@/features/estoque/lib/types'
import { calcularCustoInsumos } from '../../lib/precificacao-helpers'
import type {
  CriarProdutoInput,
  FichaTecnicaItemInput,
  InsumoOption,
} from '../../lib/types'

export function PassoFichaTecnica({
  dados,
  insumos,
  onAvancar,
  onVoltar,
}: {
  dados: CriarProdutoInput
  insumos: InsumoOption[]
  onAvancar: (dados: Partial<CriarProdutoInput>) => void
  onVoltar: () => void
}) {
  const [fichaTecnica, setFichaTecnica] = useState<FichaTecnicaItemInput[]>(
    dados.fichaTecnica
  )
  const [busca, setBusca] = useState('')
  const [open, setOpen] = useState(false)

  const jaAdicionados = new Set(fichaTecnica.map((item) => item.estoqueItemId))
  const termo = busca.trim().toLowerCase()
  const disponiveis = insumos.filter((i) => !jaAdicionados.has(i.id))
  const filtrados = termo
    ? disponiveis.filter((i) => i.nome.toLowerCase().includes(termo))
    : disponiveis

  const custoTotal = calcularCustoInsumos(fichaTecnica)

  function adicionar(insumo: InsumoOption) {
    setFichaTecnica((atual) => [
      ...atual,
      {
        estoqueItemId: insumo.id,
        nome: insumo.nome,
        unidade: insumo.unidade,
        quantidade: 1,
        custoUnitario: insumo.custoUnitario,
      },
    ])
    setBusca('')
    setOpen(false)
  }

  function atualizarQuantidade(estoqueItemId: string, quantidade: number) {
    setFichaTecnica((atual) =>
      atual.map((item) =>
        item.estoqueItemId === estoqueItemId ? { ...item, quantidade } : item
      )
    )
  }

  function remover(estoqueItemId: string) {
    setFichaTecnica((atual) =>
      atual.filter((item) => item.estoqueItemId !== estoqueItemId)
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
      <div className="flex flex-col gap-1.5">
        <Label className="text-sm">Adicionar insumo</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <Command
            shouldFilter={false}
            className="overflow-visible bg-transparent"
          >
            <PopoverAnchor asChild>
              <CommandInput
                value={busca}
                onValueChange={(v) => {
                  setBusca(v)
                  setOpen(true)
                }}
                onFocus={() => setOpen(true)}
                placeholder="Buscar insumo do estoque..."
                wrapperClassName="h-9 rounded-md border border-input shadow-sm"
              />
            </PopoverAnchor>
            <PopoverContent
              className="w-(--radix-popover-trigger-width) p-0"
              align="start"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <CommandList>
                <CommandEmpty>Nenhum insumo encontrado.</CommandEmpty>
                <CommandGroup>
                  {filtrados.map((insumo) => (
                    <CommandItem
                      key={insumo.id}
                      value={insumo.id}
                      onSelect={() => adicionar(insumo)}
                    >
                      <span className="flex-1">{insumo.nome}</span>
                      <span className="text-xs text-muted-foreground">
                        {CATEGORIA_ESTOQUE_LABEL[insumo.categoria]}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </PopoverContent>
          </Command>
        </Popover>
      </div>

      {fichaTecnica.length === 0 ? (
        <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
          Nenhum insumo adicionado ainda.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {fichaTecnica.map((item) => (
            <div
              key={item.estoqueItemId}
              className="flex items-center gap-2 rounded-md border p-2"
            >
              <span className="flex-1 truncate text-sm">{item.nome}</span>
              <Input
                type="number"
                min={0}
                step="0.001"
                value={item.quantidade}
                onChange={(e) =>
                  atualizarQuantidade(
                    item.estoqueItemId,
                    Number(e.target.value)
                  )
                }
                className="h-8 w-24"
              />
              <span className="w-8 text-xs text-muted-foreground">
                {item.unidade}
              </span>
              <span className="w-20 text-right text-xs tabular-nums text-muted-foreground">
                {formatCurrencyBRL(item.quantidade * item.custoUnitario)}
              </span>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-8 shrink-0"
                onClick={() => remover(item.estoqueItemId)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between rounded-md bg-muted/50 p-3 text-sm">
        <span className="text-muted-foreground">Custo de insumos</span>
        <span className="font-medium tabular-nums">
          {formatCurrencyBRL(custoTotal)}
        </span>
      </div>

      <div className="mt-auto flex justify-between border-t pt-4">
        <Button variant="outline" onClick={onVoltar}>
          Voltar
        </Button>
        <Button onClick={() => onAvancar({ fichaTecnica })}>Próximo</Button>
      </div>
    </div>
  )
}
