'use client'

import { useState } from 'react'
import { ChevronLeft, Pin, Scale } from 'lucide-react'

import { Button } from '@repo/ui/components/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select'
import { cn } from '@repo/ui/lib/utils'

import { formatCurrencyBRL } from '@/lib/formatters'
import type { Unidade } from '@/features/estoque/lib/types'
import type { FichaTecnicaItemInput, TamanhoInput } from '../../lib/types'

/** Só o template de colunas — coluna extra de escala aparece só quando o produto tem tamanhos. */
export function fichaTecnicaGridCols(temTamanhos: boolean): string {
  return temTamanhos
    ? 'grid-cols-[24px_1fr_40px_48px_76px_28px]'
    : 'grid-cols-[24px_1fr_40px_48px_76px]'
}

/**
 * Grupos de unidade "trocáveis" — sólido em g/kg, líquido em ml/l. Um
 * insumo guardado em kg no estoque pode ser digitado na ficha técnica em
 * kg ou g, o que for mais natural pra quantidade da receita (250g em vez de
 * fazer a conta de cabeça pra 0,25kg).
 */
const GRUPOS_UNIDADE: Partial<Record<Unidade, readonly Unidade[]>> = {
  kg: ['kg', 'g'],
  g: ['kg', 'g'],
  l: ['l', 'ml'],
  ml: ['l', 'ml'],
}

function converter(valor: number, de: Unidade, para: Unidade): number {
  if (de === para) return valor
  if ((de === 'kg' && para === 'g') || (de === 'l' && para === 'ml')) {
    return valor * 1000
  }
  if ((de === 'g' && para === 'kg') || (de === 'ml' && para === 'l')) {
    return valor / 1000
  }
  return valor
}

/** Só dígitos e uma casa decimal (vírgula ou ponto) — deixa digitar livre sem o navegador atrapalhar. */
function sanitizar(texto: string): string {
  const limpo = texto.replace(/[^0-9.,]/g, '').replace(',', '.')
  const partes = limpo.split('.')
  if (partes.length <= 1) return limpo
  return `${partes[0]}.${partes.slice(1).join('')}`
}

function paraNumero(texto: string): number {
  const numero = Number(texto)
  return Number.isFinite(numero) ? numero : 0
}

function formatarParaInput(valor: number): string {
  if (valor === 0) return ''
  // Até 3 casas, sem zero à direita sobrando (ex: 250, não 250.000).
  return String(Math.round(valor * 1000) / 1000)
}

export function FichaTecnicaLinha({
  item,
  tamanhos,
  onChange,
  onRemover,
  onAlternarTipoEscala,
  onChangeOverride,
}: {
  item: FichaTecnicaItemInput
  /** `null` = produto sem tamanhos, coluna de escala nem aparece. */
  tamanhos: TamanhoInput[] | null
  onChange: (quantidade: number) => void
  onRemover: () => void
  onAlternarTipoEscala: () => void
  onChangeOverride: (tamanhoKey: string, quantidade: number) => void
}) {
  const opcoesUnidade = GRUPOS_UNIDADE[item.unidade]
  const [unidadeEntrada, setUnidadeEntrada] = useState<Unidade>(item.unidade)
  const [texto, setTexto] = useState(() =>
    formatarParaInput(converter(item.quantidade, item.unidade, unidadeEntrada))
  )

  function aoDigitar(valor: string) {
    const limpo = sanitizar(valor)
    setTexto(limpo)
    onChange(converter(paraNumero(limpo), unidadeEntrada, item.unidade))
  }

  function trocarUnidade(nova: Unidade) {
    if (nova === unidadeEntrada) return
    const valorAtual = converter(paraNumero(texto), unidadeEntrada, item.unidade)
    setUnidadeEntrada(nova)
    setTexto(formatarParaInput(converter(valorAtual, item.unidade, nova)))
  }

  const custoLinha = item.quantidade * item.custoUnitario
  // Arredondado pra cima — o custo da receita nunca aparece menor do que
  // vai custar de verdade.
  const custoLinhaArredondado = Math.ceil(custoLinha * 100) / 100

  const mostrarOverrides = tamanhos != null && item.tipoEscala === 'fixo'

  return (
    <div className="flex flex-col gap-1 rounded-md bg-muted/50 p-2">
      <div className={cn('grid items-center gap-2', fichaTecnicaGridCols(tamanhos != null))}>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-6 shrink-0"
          onClick={onRemover}
          aria-label="Remover da ficha técnica"
        >
          <ChevronLeft className="size-4" />
        </Button>

        <span className="truncate text-sm">{item.nome}</span>

        <input
          type="text"
          inputMode="decimal"
          placeholder="0"
          value={texto}
          onChange={(e) => aoDigitar(e.target.value)}
          onFocus={(e) => e.target.select()}
          className="h-8 w-full rounded-md border border-input bg-transparent px-1.5 text-right text-sm shadow-sm tabular-nums focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />

        {opcoesUnidade ? (
          <Select value={unidadeEntrada} onValueChange={trocarUnidade}>
            <SelectTrigger className="h-8 gap-0.5 px-1.5 text-xs [&>svg]:size-3">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {opcoesUnidade.map((u) => (
                <SelectItem key={u} value={u} className="text-xs">
                  {u}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className="text-center text-xs text-muted-foreground">
            {item.unidade}
          </span>
        )}

        <span className="text-right text-xs tabular-nums text-muted-foreground">
          {formatCurrencyBRL(custoLinhaArredondado)}
        </span>

        {tamanhos != null && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-6 shrink-0"
            onClick={onAlternarTipoEscala}
            aria-label={
              item.tipoEscala === 'fixo'
                ? 'Escala proporcional ao tamanho'
                : 'Quantidade fixa por tamanho'
            }
            title={
              item.tipoEscala === 'fixo'
                ? 'Quantidade fixa por tamanho — trocar para proporcional'
                : 'Escala com o peso do tamanho — trocar para fixa'
            }
          >
            {item.tipoEscala === 'fixo' ? (
              <Pin className="size-3.5" />
            ) : (
              <Scale className="size-3.5 text-muted-foreground" />
            )}
          </Button>
        )}
      </div>

      {mostrarOverrides && (
        <div className="ml-8 flex flex-wrap gap-3 rounded-md bg-background/60 p-2">
          {tamanhos?.map((tamanho) => {
            const override = item.overridesPorTamanho.find(
              (o) => o.tamanhoKey === tamanho.key
            )
            return (
              <label
                key={tamanho.key}
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                {tamanho.nome || 'Tamanho'}
                <input
                  type="number"
                  min={0}
                  step="0.001"
                  value={override?.quantidade ?? 0}
                  onChange={(e) =>
                    onChangeOverride(tamanho.key, Number(e.target.value))
                  }
                  className="h-7 w-16 rounded-md border border-input bg-transparent px-1.5 text-right text-xs tabular-nums shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <span>{item.unidade}</span>
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}
