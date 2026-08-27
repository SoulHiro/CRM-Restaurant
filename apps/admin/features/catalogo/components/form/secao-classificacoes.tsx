'use client'

import { CupSoda, UtensilsCrossed } from 'lucide-react'

import { Card, CardContent } from '@repo/ui/components/card'
import { Label } from '@repo/ui/components/label'

import { CLASSIFICACAO_ICON_MAP } from '../../lib/classificacao-icons'
import { classificacoesPorTipo } from '../../lib/classificacoes'
import { TIPO_PRODUTO_LABEL, TIPOS_PRODUTO } from '../../lib/types'
import type { CriarProdutoInput, TipoProduto } from '../../lib/types'
import { SelectableCard } from '@repo/ui/components/selectable-card'

const TIPO_ICON: Record<TipoProduto, typeof UtensilsCrossed> = {
  comida: UtensilsCrossed,
  bebida: CupSoda,
}

export function SecaoClassificacoes({
  dados,
  onChange,
}: {
  dados: CriarProdutoInput
  onChange: (parcial: Partial<CriarProdutoInput>) => void
}) {
  const classificacoesDisponiveis = classificacoesPorTipo(dados.tipo)
  const selecionadas = new Set(dados.classificacoes)

  function toggle(key: string) {
    onChange({
      classificacoes: selecionadas.has(key)
        ? dados.classificacoes.filter((c) => c !== key)
        : [...dados.classificacoes, key],
    })
  }

  return (
    <Card className="border-0">
      <CardContent className="flex flex-col gap-4 p-6">
        <div className="flex flex-col gap-1.5">
          <Label className="text-sm">Tipo</Label>
          <div className="grid grid-cols-2 gap-3">
            {TIPOS_PRODUTO.map((t) => (
              <SelectableCard
                key={t}
                icon={TIPO_ICON[t]}
                label={TIPO_PRODUTO_LABEL[t]}
                selected={dados.tipo === t}
                onClick={() => onChange({ tipo: t as TipoProduto })}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-3">
          {classificacoesDisponiveis.map((c) => (
            <SelectableCard
              key={c.key}
              icon={CLASSIFICACAO_ICON_MAP[c.icone]}
              label={c.nome}
              description={c.descricao}
              selected={selecionadas.has(c.key)}
              onClick={() => toggle(c.key)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
