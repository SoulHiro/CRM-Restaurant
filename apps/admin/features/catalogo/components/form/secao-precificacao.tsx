'use client'

import { Checkbox } from '@repo/ui/components/checkbox'
import { Input } from '@repo/ui/components/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select'

import { formatCurrencyBRL } from '@/lib/formatters'
import { calcularPrecoComDesconto } from '../../lib/precificacao-helpers'
import type { CriarProdutoInput } from '../../lib/types'

/**
 * Bloco de desconto — vive dentro da aba Item (`secao-basico.tsx`), não é
 * aba própria. Um desconto só pro produto inteiro (não por tamanho) — quando
 * `temTamanhos`, ele se aplica igual em cima do preço de cada tamanho (ver
 * `TamanhoResumoLinha` no resumo).
 */
export function SecaoPrecificacao({
  dados,
  onChange,
}: {
  dados: CriarProdutoInput
  onChange: (parcial: Partial<CriarProdutoInput>) => void
}) {
  const temDesconto = dados.descontoValor != null

  const precoComDesconto = calcularPrecoComDesconto(
    dados.precoVenda,
    dados.descontoTipo,
    dados.descontoValor
  )

  return (
    <div className="flex flex-col gap-2 rounded-md bg-muted/50 p-3">
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <Checkbox
          checked={temDesconto}
          onCheckedChange={(checked) =>
            onChange({ descontoValor: checked ? 0 : null })
          }
        />
        Aplicar desconto
      </label>
      {temDesconto && (
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={dados.descontoTipo}
            onValueChange={(v) =>
              onChange({ descontoTipo: v as CriarProdutoInput['descontoTipo'] })
            }
          >
            <SelectTrigger className="h-9 w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentual">%</SelectItem>
              <SelectItem value="valorFixo">R$</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="number"
            min={0}
            max={dados.descontoTipo === 'percentual' ? 100 : undefined}
            step="0.1"
            value={dados.descontoValor ?? 0}
            onChange={(e) =>
              onChange({ descontoValor: Number(e.target.value) })
            }
            className="w-24"
          />

          {!dados.temTamanhos && (
            <span className="text-sm">
              <span className="text-muted-foreground line-through">
                {formatCurrencyBRL(dados.precoVenda)}
              </span>{' '}
              <span className="font-medium">
                {formatCurrencyBRL(precoComDesconto)}
              </span>
            </span>
          )}
        </div>
      )}
    </div>
  )
}
