'use client'

import { Card, CardContent } from '@repo/ui/components/card'
import { Checkbox } from '@repo/ui/components/checkbox'
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

export function SecaoPrecificacao({
  dados,
  onChange,
  configuracaoPrecificacao,
}: {
  dados: CriarProdutoInput
  onChange: (parcial: Partial<CriarProdutoInput>) => void
  configuracaoPrecificacao: ConfiguracaoPrecificacao
}) {
  const temDesconto = dados.descontoPercentual != null

  const custoInsumos = calcularCustoInsumos(dados.fichaTecnica)
  const custoProducao = calcularCustoProducao(
    custoInsumos,
    dados.tempoMedioPreparoMinutos,
    configuracaoPrecificacao.custoOperacionalPorMinuto
  )
  const faixas = calcularFaixasPreco(custoProducao, {
    minimaPct: configuracaoPrecificacao.limiarVerdePct,
    maximaPct: configuracaoPrecificacao.limiarAzulPct,
  })

  const margem = calcularMargemPercentual(dados.precoVenda, custoProducao)
  const cor = corMargem(margem, {
    amareloPct: configuracaoPrecificacao.limiarAmareloPct,
    verdePct: configuracaoPrecificacao.limiarVerdePct,
    azulPct: configuracaoPrecificacao.limiarAzulPct,
    roxoPct: configuracaoPrecificacao.limiarRoxoPct,
  })

  const precoComDesconto = temDesconto
    ? dados.precoVenda * (1 - (dados.descontoPercentual ?? 0) / 100)
    : dados.precoVenda

  return (
    <Card className="border-0">
      <CardContent className="flex flex-col gap-4 p-6">
        <div className="flex flex-col gap-1.5">
          <Label className="text-sm">Tempo médio de preparo (minutos)</Label>
          <Input
            type="number"
            min={0}
            value={dados.tempoMedioPreparoMinutos}
            onChange={(e) =>
              onChange({ tempoMedioPreparoMinutos: Number(e.target.value) })
            }
            className="max-w-48"
          />
        </div>

        <div className="grid grid-cols-1 gap-2 rounded-md bg-muted/50 p-3 text-sm sm:grid-cols-3">
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
            value={dados.precoVenda}
            onChange={(e) => onChange({ precoVenda: Number(e.target.value) })}
            className="max-w-48"
          />
          <p className={cn('text-sm font-medium', COR_MARGEM_CLASSE[cor])}>
            {COR_MARGEM_LABEL[cor]} — margem de {margem.toFixed(0)}% sobre o
            custo de produção ({formatCurrencyBRL(custoProducao)})
          </p>
        </div>

        <div className="flex flex-col gap-2 rounded-md bg-muted/50 p-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox
              checked={temDesconto}
              onCheckedChange={(checked) =>
                onChange({ descontoPercentual: checked ? 0 : null })
              }
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
                value={dados.descontoPercentual ?? 0}
                onChange={(e) =>
                  onChange({ descontoPercentual: Number(e.target.value) })
                }
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">%</span>
              <span className="text-sm">
                <span className="text-muted-foreground line-through">
                  {formatCurrencyBRL(dados.precoVenda)}
                </span>{' '}
                <span className="font-medium">
                  {formatCurrencyBRL(precoComDesconto)}
                </span>
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
