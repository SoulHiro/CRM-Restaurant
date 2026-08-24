'use client'

import { useState } from 'react'

import { cn } from '@repo/ui/lib/utils'

import type {
  ConfiguracaoHorarioFuncionamento,
  ConfiguracaoPrecificacao,
} from '@/features/configuracoes/lib/types'
import type {
  AdicionalOption,
  CategoriaProdutoOption,
  ClassificacaoOption,
  CriarProdutoInput,
  InsumoOption,
} from '../../lib/types'
import { PassoBasico } from './passo-basico'
import { PassoClassificacoes } from './passo-classificacoes'
import { PassoDisponibilidade } from './passo-disponibilidade'
import { PassoFichaTecnica } from './passo-ficha-tecnica'
import { PassoPrecificacao } from './passo-precificacao'
import { PassoRevisao } from './passo-revisao'
import {
  PASSOS_PRODUTO,
  PRODUTO_WIZARD_DEFAULTS,
  type PassoProduto,
} from './produto-wizard-types'

export function ProdutoWizard({
  categorias,
  insumos,
  classificacoes,
  adicionais,
  horarioFuncionamento,
  configuracaoPrecificacao,
}: {
  categorias: CategoriaProdutoOption[]
  insumos: InsumoOption[]
  classificacoes: ClassificacaoOption[]
  adicionais: AdicionalOption[]
  horarioFuncionamento: ConfiguracaoHorarioFuncionamento
  configuracaoPrecificacao: ConfiguracaoPrecificacao
}) {
  const [passo, setPasso] = useState<PassoProduto>('basico')
  const [dados, setDados] = useState<CriarProdutoInput>(PRODUTO_WIZARD_DEFAULTS)

  function avancar(proximo: PassoProduto, parcial: Partial<CriarProdutoInput>) {
    setDados((atual) => ({ ...atual, ...parcial }))
    setPasso(proximo)
  }

  const indiceAtual = PASSOS_PRODUTO.findIndex((p) => p.id === passo)

  return (
    <div className="flex h-full flex-col gap-0 rounded-lg border bg-card">
      <div className="flex flex-col gap-3 border-b p-4">
        <div>
          <h1 className="text-lg font-semibold">Novo produto</h1>
          <p className="text-sm text-muted-foreground">
            {PASSOS_PRODUTO[indiceAtual]?.label} — passo {indiceAtual + 1} de{' '}
            {PASSOS_PRODUTO.length}
          </p>
        </div>
        <div className="flex gap-2">
          {PASSOS_PRODUTO.map((item, indice) => (
            <div
              key={item.id}
              className={cn(
                'h-1 flex-1 rounded-full bg-muted',
                indice <= indiceAtual && 'bg-primary'
              )}
            />
          ))}
        </div>
      </div>

      {passo === 'basico' && (
        <PassoBasico
          dados={dados}
          categoriasIniciais={categorias}
          onAvancar={(parcial) => avancar('ficha-tecnica', parcial)}
        />
      )}

      {passo === 'ficha-tecnica' && (
        <PassoFichaTecnica
          dados={dados}
          insumos={insumos}
          onAvancar={(parcial) => avancar('precificacao', parcial)}
          onVoltar={() => setPasso('basico')}
        />
      )}

      {passo === 'precificacao' && (
        <PassoPrecificacao
          dados={dados}
          configuracaoPrecificacao={configuracaoPrecificacao}
          onAvancar={(parcial) => avancar('disponibilidade', parcial)}
          onVoltar={() => setPasso('ficha-tecnica')}
        />
      )}

      {passo === 'disponibilidade' && (
        <PassoDisponibilidade
          dados={dados}
          horarioFuncionamento={horarioFuncionamento}
          onAvancar={(parcial) => avancar('classificacoes', parcial)}
          onVoltar={() => setPasso('precificacao')}
        />
      )}

      {passo === 'classificacoes' && (
        <PassoClassificacoes
          dados={dados}
          classificacoesIniciais={classificacoes}
          adicionaisIniciais={adicionais}
          onAvancar={(parcial) => avancar('revisao', parcial)}
          onVoltar={() => setPasso('disponibilidade')}
        />
      )}

      {passo === 'revisao' && (
        <PassoRevisao
          dados={dados}
          configuracaoPrecificacao={configuracaoPrecificacao}
          onVoltar={() => setPasso('classificacoes')}
        />
      )}
    </div>
  )
}
