'use client'

import { Tag } from 'lucide-react'

import { Card, CardContent } from '@repo/ui/components/card'

import type { CriarProdutoInput, GrupoAdicionalOption } from '../../lib/types'
import { SelectableCard } from '../shared/selectable-card'

export function SecaoAdicionais({
  dados,
  onChange,
  grupos,
}: {
  dados: CriarProdutoInput
  onChange: (parcial: Partial<CriarProdutoInput>) => void
  grupos: GrupoAdicionalOption[]
}) {
  const grupoIds = new Set(dados.grupoAdicionalIds)

  const gruposCompativeis = grupos.filter(
    (grupo) =>
      (dados.apareceAlmoco && grupo.disponivelAlmoco) ||
      (dados.apareceJanta && grupo.disponivelJanta)
  )

  function toggle(id: string) {
    onChange({
      grupoAdicionalIds: grupoIds.has(id)
        ? dados.grupoAdicionalIds.filter((g) => g !== id)
        : [...dados.grupoAdicionalIds, id],
    })
  }

  return (
    <Card className="border-0">
      <CardContent className="p-6">
        {gruposCompativeis.length === 0 ? (
          <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
            Nenhum grupo de adicionais disponível pro turno escolhido. Crie um
            em Catálogo → Adicionais.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {gruposCompativeis.map((grupo) => (
              <SelectableCard
                key={grupo.id}
                icon={Tag}
                label={grupo.nome}
                description={`${grupo.itens.length} ${grupo.itens.length === 1 ? 'item' : 'itens'}`}
                selected={grupoIds.has(grupo.id)}
                onClick={() => toggle(grupo.id)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
