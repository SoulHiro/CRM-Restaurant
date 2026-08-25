'use client'

import { Card, CardContent } from '@repo/ui/components/card'

import { CLASSIFICACAO_ICON_MAP } from '../../lib/classificacao-icons'
import { classificacoesPorTipo } from '../../lib/classificacoes'
import type { CriarProdutoInput } from '../../lib/types'
import { SelectableCard } from '../shared/selectable-card'

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
      <CardContent className="p-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
