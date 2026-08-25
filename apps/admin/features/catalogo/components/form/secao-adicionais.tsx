'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Layers, Search, Tag, X } from 'lucide-react'

import { Button } from '@repo/ui/components/button'
import { Card, CardContent } from '@repo/ui/components/card'
import { EmptyState } from '@repo/ui/components/empty-state'
import { Input } from '@repo/ui/components/input'
import { Label } from '@repo/ui/components/label'

import { CriarGrupoDrawer } from '../adicionais/criar-grupo-drawer'
import type { CriarProdutoInput, GrupoAdicionalOption } from '../../lib/types'
import { SelectableCard } from '../shared/selectable-card'

export function SecaoAdicionais({
  dados,
  onChange,
  grupos: gruposIniciais,
}: {
  dados: CriarProdutoInput
  onChange: (parcial: Partial<CriarProdutoInput>) => void
  grupos: GrupoAdicionalOption[]
}) {
  const [grupos, setGrupos] = useState(gruposIniciais)
  const [aceitaAdicionais, setAceitaAdicionais] = useState(
    dados.grupoAdicionalIds.length > 0
  )
  const [busca, setBusca] = useState('')

  const grupoIds = new Set(dados.grupoAdicionalIds)

  const gruposCompativeis = grupos.filter(
    (grupo) =>
      (dados.apareceAlmoco && grupo.disponivelAlmoco) ||
      (dados.apareceJanta && grupo.disponivelJanta)
  )

  const termo = busca.trim().toLowerCase()
  const disponiveis = gruposCompativeis
    .filter((grupo) => !grupoIds.has(grupo.id))
    .filter((grupo) => !termo || grupo.nome.toLowerCase().includes(termo))

  const selecionados = gruposCompativeis.filter((grupo) => grupoIds.has(grupo.id))

  function adicionar(id: string) {
    onChange({ grupoAdicionalIds: [...dados.grupoAdicionalIds, id] })
  }

  function remover(id: string) {
    onChange({
      grupoAdicionalIds: dados.grupoAdicionalIds.filter((g) => g !== id),
    })
  }

  function aoDesativar() {
    setAceitaAdicionais(false)
    onChange({ grupoAdicionalIds: [] })
  }

  function aoCriarGrupo(grupo: GrupoAdicionalOption) {
    setGrupos((atual) => [...atual, grupo])
    adicionar(grupo.id)
  }

  return (
    <Card className="border-0">
      <CardContent className="flex flex-col gap-4 p-6">
        <div className="flex flex-col gap-2">
          <Label className="text-sm">Este produto aceita adicionais?</Label>
          <div className="grid grid-cols-2 gap-3">
            <SelectableCard
              icon={Tag}
              label="Sim"
              selected={aceitaAdicionais}
              onClick={() => setAceitaAdicionais(true)}
            />
            <SelectableCard
              icon={X}
              label="Não"
              selected={!aceitaAdicionais}
              onClick={aoDesativar}
            />
          </div>
        </div>

        {aceitaAdicionais && (
          <div className="grid grid-cols-1 gap-4 border-t pt-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label className="text-sm text-muted-foreground">
                Grupos disponíveis
              </Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar grupo..."
                  className="pl-8"
                />
              </div>

              <div className="flex max-h-80 flex-col gap-1 overflow-y-auto p-1">
                {disponiveis.length === 0 ? (
                  <EmptyState message="Nenhum grupo disponível pro turno deste produto." />
                ) : (
                  disponiveis.map((grupo) => (
                    <button
                      key={grupo.id}
                      type="button"
                      onClick={() => adicionar(grupo.id)}
                      className="group flex cursor-pointer items-center gap-2 rounded-md p-2 text-left hover:bg-accent"
                    >
                      <Layers className="size-4 shrink-0 text-muted-foreground" />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-medium">
                          {grupo.nome}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {grupo.itens.length}{' '}
                          {grupo.itens.length === 1 ? 'item' : 'itens'}
                        </span>
                      </div>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
                    </button>
                  ))
                )}
              </div>

              <CriarGrupoDrawer onCriado={aoCriarGrupo} />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-sm text-muted-foreground">
                Selecionados ({selecionados.length})
              </Label>
              {selecionados.length === 0 ? (
                <EmptyState message="Nenhum grupo escolhido ainda." />
              ) : (
                <div className="flex max-h-80 flex-col gap-1 overflow-y-auto">
                  {selecionados.map((grupo) => (
                    <div
                      key={grupo.id}
                      className="flex items-center gap-2 rounded-md bg-muted/50 p-2"
                    >
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-6 shrink-0"
                        aria-label={`Remover ${grupo.nome}`}
                        onClick={() => remover(grupo.id)}
                      >
                        <ChevronLeft className="size-4" />
                      </Button>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-medium">
                          {grupo.nome}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {grupo.itens.length}{' '}
                          {grupo.itens.length === 1 ? 'item' : 'itens'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
