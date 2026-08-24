'use client'

import { useState } from 'react'

import { Button } from '@repo/ui/components/button'
import { Input } from '@repo/ui/components/input'
import { Label } from '@repo/ui/components/label'
import { cn } from '@repo/ui/lib/utils'

import type { ConfiguracaoPrecificacao } from '@/features/configuracoes/lib/types'
import { formatCurrencyBRL } from '@/lib/formatters'
import {
  COR_MARGEM_CLASSE,
  COR_MARGEM_LABEL,
  calcularCustoInsumos,
  calcularCustoProducao,
  calcularFaixasPreco,
  calcularMargemPercentual,
  corMargem,
} from '../../lib/precificacao-helpers'
import type { CriarProdutoInput } from '../../lib/types'

export function PassoPrecificacao({
  dados,
  configuracaoPrecificacao,
  onAvancar,
  onVoltar,
}: {
  dados: CriarProdutoInput
  configuracaoPrecificacao: ConfiguracaoPrecificacao
  onAvancar: (dados: Partial<CriarProdutoInput>) => void
  onVoltar: () => void
}) {
  const [tempoPreparo, setTempoPreparo] = useState(
    dados.tempoMedioPreparoMinutos
  )
  const [precoVenda, setPrecoVenda] = useState(dados.precoVenda)
  const [temDesconto, setTemDesconto] = useState(
    dados.descontoPercentual != null
  )
  const [descontoPercentual, setDescontoPercentual] = useState(
    dados.descontoPercentual ?? 0
  )

  const custoInsumos = calcularCustoInsumos(dados.fichaTecnica)
  const custoProducao = calcularCustoProducao(
    custoInsumos,
    tempoPreparo,
    configuracaoPrecificacao.custoOperacionalPorMinuto
  )
  const faixas = calcularFaixasPreco(custoProducao, {
    minimaPct: configuracaoPrecificacao.limiarVerdePct,
    maximaPct: configuracaoPrecificacao.limiarAzulPct,
  })

  const margem = calcularMargemPercentual(precoVenda, custoProducao)
  const cor = corMargem(margem, {
    amareloPct: configuracaoPrecificacao.limiarAmareloPct,
    verdePct: configuracaoPrecificacao.limiarVerdePct,
    azulPct: configuracaoPrecificacao.limiarAzulPct,
    roxoPct: configuracaoPrecificacao.limiarRoxoPct,
  })

  const precoComDesconto = temDesconto
    ? precoVenda * (1 - descontoPercentual / 100)
    : precoVenda

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
      <div className="flex flex-col gap-1.5">
        <Label className="text-sm">Tempo médio de preparo (minutos)</Label>
        <Input
          type="number"
          min={0}
          value={tempoPreparo}
          onChange={(e) => setTempoPreparo(Number(e.target.value))}
        />
      </div>

      <div className="grid grid-cols-1 gap-2 rounded-md border p-3 text-sm sm:grid-cols-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Sobrevivência</span>
          <span className="font-medium tabular-nums">
            {formatCurrencyBRL(faixas.minimoSobrevivencia)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">
            Mínimo recomendado
          </span>
          <span className="font-medium tabular-nums">
            {formatCurrencyBRL(faixas.minimoRecomendado)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">
            Máximo recomendado
          </span>
          <span className="font-medium tabular-nums">
            {formatCurrencyBRL(faixas.maximoRecomendado)}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-sm">Preço de venda</Label>
        <Input
          type="number"
          min={0}
          step="0.01"
          value={precoVenda}
          onChange={(e) => setPrecoVenda(Number(e.target.value))}
        />
        <p className={cn('text-sm font-medium', COR_MARGEM_CLASSE[cor])}>
          {COR_MARGEM_LABEL[cor]} — margem de {margem.toFixed(0)}% sobre o custo
          de produção ({formatCurrencyBRL(custoProducao)})
        </p>
      </div>

      <div className="flex flex-col gap-2 rounded-md border p-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={temDesconto}
            onChange={(e) => setTemDesconto(e.target.checked)}
          />
          Aplicar desconto
        </label>
        {temDesconto && (
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={0}
              max={100}
              step="0.1"
              value={descontoPercentual}
              onChange={(e) => setDescontoPercentual(Number(e.target.value))}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">%</span>
            <span className="text-sm">
              <span className="text-muted-foreground line-through">
                {formatCurrencyBRL(precoVenda)}
              </span>{' '}
              <span className="font-medium">
                {formatCurrencyBRL(precoComDesconto)}
              </span>
            </span>
          </div>
        )}
      </div>

      <div className="mt-auto flex justify-between border-t pt-4">
        <Button variant="outline" onClick={onVoltar}>
          Voltar
        </Button>
        <Button
          onClick={() =>
            onAvancar({
              tempoMedioPreparoMinutos: tempoPreparo,
              precoVenda,
              descontoPercentual: temDesconto ? descontoPercentual : null,
            })
          }
        >
          Próximo
        </Button>
      </div>
    </div>
  )
}
