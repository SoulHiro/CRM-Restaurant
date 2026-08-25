'use client'

import { useState } from 'react'
import { Carrot, ChefHat, ChevronRight, CircleHelp, Package } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Card, CardContent } from '@repo/ui/components/card'
import { Input } from '@repo/ui/components/input'
import { cn } from '@repo/ui/lib/utils'

import { formatCurrencyBRL } from '@/lib/formatters'
import type { CategoriaEstoque } from '@/features/estoque/lib/types'
import { calcularCustoInsumos } from '../../lib/precificacao-helpers'
import type { CriarProdutoInput, InsumoOption } from '../../lib/types'
import { FichaTecnicaLinha, fichaTecnicaGridCols } from './ficha-tecnica-linha'

const CATEGORIA_ICONE: Record<CategoriaEstoque, LucideIcon> = {
  comestivel: Carrot,
  preparo: ChefHat,
  embalagem: Package,
  outro: CircleHelp,
}

export function SecaoFichaTecnica({
  dados,
  onChange,
  insumos,
}: {
  dados: CriarProdutoInput
  onChange: (parcial: Partial<CriarProdutoInput>) => void
  insumos: InsumoOption[]
}) {
  const [busca, setBusca] = useState('')

  const fichaTecnica = dados.fichaTecnica
  const jaAdicionados = new Set(fichaTecnica.map((item) => item.estoqueItemId))
  const termo = busca.trim().toLowerCase()
  const disponiveis = insumos.filter((i) => !jaAdicionados.has(i.id))
  const filtrados = termo
    ? disponiveis.filter((i) => i.nome.toLowerCase().includes(termo))
    : disponiveis

  const custoTotal = calcularCustoInsumos(fichaTecnica)

  function adicionar(insumo: InsumoOption) {
    onChange({
      fichaTecnica: [
        ...fichaTecnica,
        {
          estoqueItemId: insumo.id,
          nome: insumo.nome,
          unidade: insumo.unidade,
          // Nasce zerado (input começa vazio) — a pessoa digita a
          // quantidade real da receita em vez de sobrescrever um valor
          // pré-preenchido.
          quantidade: 0,
          custoUnitario: insumo.custoUnitario,
          tipoEscala: 'proporcional',
          overridesPorTamanho: [],
        },
      ],
    })
  }

  function atualizarQuantidade(estoqueItemId: string, quantidade: number) {
    onChange({
      fichaTecnica: fichaTecnica.map((item) =>
        item.estoqueItemId === estoqueItemId ? { ...item, quantidade } : item
      ),
    })
  }

  function remover(estoqueItemId: string) {
    onChange({
      fichaTecnica: fichaTecnica.filter(
        (item) => item.estoqueItemId !== estoqueItemId
      ),
    })
  }

  function alternarTipoEscala(estoqueItemId: string) {
    onChange({
      fichaTecnica: fichaTecnica.map((item) => {
        if (item.estoqueItemId !== estoqueItemId) return item
        if (item.tipoEscala === 'fixo') {
          return { ...item, tipoEscala: 'proporcional', overridesPorTamanho: [] }
        }
        return {
          ...item,
          tipoEscala: 'fixo',
          overridesPorTamanho: dados.tamanhos.map((tamanho) => ({
            tamanhoKey: tamanho.key,
            estoqueItemId: null,
            quantidade: item.quantidade,
          })),
        }
      }),
    })
  }

  function atualizarOverride(
    estoqueItemId: string,
    tamanhoKey: string,
    quantidade: number
  ) {
    onChange({
      fichaTecnica: fichaTecnica.map((item) => {
        if (item.estoqueItemId !== estoqueItemId) return item
        const existe = item.overridesPorTamanho.some(
          (o) => o.tamanhoKey === tamanhoKey
        )
        return {
          ...item,
          overridesPorTamanho: existe
            ? item.overridesPorTamanho.map((o) =>
                o.tamanhoKey === tamanhoKey ? { ...o, quantidade } : o
              )
            : [
                ...item.overridesPorTamanho,
                { tamanhoKey, estoqueItemId: null, quantidade },
              ],
        }
      }),
    })
  }

  return (
    <Card className="border-0">
      <CardContent className="flex flex-col gap-4 p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar insumo do estoque..."
              className="h-9"
            />

            <div className="flex max-h-80 flex-col gap-1 overflow-y-auto p-1">
              {filtrados.length === 0 ? (
                <p className="p-3 text-center text-sm text-muted-foreground">
                  Nenhum insumo encontrado.
                </p>
              ) : (
                filtrados.map((insumo) => {
                  const Icone = CATEGORIA_ICONE[insumo.categoria]
                  return (
                    <button
                      key={insumo.id}
                      type="button"
                      onClick={() => adicionar(insumo)}
                      className="group flex cursor-pointer items-center gap-2 rounded-md p-2 text-left hover:bg-accent"
                    >
                      <Icone className="size-4 shrink-0 text-muted-foreground" />
                      <span className="flex-1 truncate text-sm">
                        {insumo.nome}
                      </span>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
                    </button>
                  )
                })
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            {fichaTecnica.length === 0 ? (
              <p className="flex h-full items-center justify-center rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                Nenhum insumo adicionado ainda.
              </p>
            ) : (
              <>
                <div
                  className={cn(
                    'grid gap-2 px-2 text-xs text-muted-foreground',
                    fichaTecnicaGridCols(dados.temTamanhos)
                  )}
                >
                  <span />
                  <span>Insumo</span>
                  <span className="text-right">Qtd.</span>
                  <span className="text-center">Unidade</span>
                  <span className="text-right">Custo</span>
                  {dados.temTamanhos && <span />}
                </div>
                <div className="flex max-h-80 flex-col gap-1 overflow-y-auto">
                  {fichaTecnica.map((item) => (
                    <FichaTecnicaLinha
                      key={item.estoqueItemId}
                      item={item}
                      tamanhos={dados.temTamanhos ? dados.tamanhos : null}
                      onChange={(quantidade) =>
                        atualizarQuantidade(item.estoqueItemId, quantidade)
                      }
                      onRemover={() => remover(item.estoqueItemId)}
                      onAlternarTipoEscala={() =>
                        alternarTipoEscala(item.estoqueItemId)
                      }
                      onChangeOverride={(tamanhoKey, quantidade) =>
                        atualizarOverride(
                          item.estoqueItemId,
                          tamanhoKey,
                          quantidade
                        )
                      }
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-md bg-muted/50 p-3 text-sm">
          <span className="text-muted-foreground">Custo de insumos</span>
          <span className="font-medium tabular-nums">
            {formatCurrencyBRL(custoTotal)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
