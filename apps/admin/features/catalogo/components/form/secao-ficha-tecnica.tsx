'use client'

import { useState } from 'react'
import { useAction } from 'next-safe-action/hooks'
import {
  Carrot,
  ChefHat,
  ChevronRight,
  CircleHelp,
  Package,
  Plus,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@repo/ui/components/button'
import { Card, CardContent } from '@repo/ui/components/card'
import { Input } from '@repo/ui/components/input'
import { Label } from '@repo/ui/components/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select'
import { cn } from '@repo/ui/lib/utils'

import { formatCurrencyBRL } from '@/lib/formatters'
import { createEstoqueItemAction } from '@/features/estoque/lib/actions'
import {
  CATEGORIA_ESTOQUE_LABEL,
  CATEGORIAS_ESTOQUE,
  UNIDADES,
  type CategoriaEstoque,
  type Unidade,
} from '@/features/estoque/lib/types'
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
  const [criandoInsumo, setCriandoInsumo] = useState(false)
  const [novoNome, setNovoNome] = useState('')
  const [novaCategoria, setNovaCategoria] =
    useState<CategoriaEstoque>('comestivel')
  const [novaUnidade, setNovaUnidade] = useState<Unidade>('un')
  const [novoPreco, setNovoPreco] = useState('')

  const fichaTecnica = dados.fichaTecnica
  const jaAdicionados = new Set(fichaTecnica.map((item) => item.estoqueItemId))
  const termo = busca.trim().toLowerCase()
  const disponiveis = insumos.filter((i) => !jaAdicionados.has(i.id))
  // Mais usado em ficha técnica de outros produtos primeiro — é o insumo que
  // a próxima receita tem mais chance de precisar também (óleo, tempero,
  // embalagem básica), então evita rolar a lista toda pra achar.
  const ordenados = [...disponiveis].sort(
    (a, b) => b.vezesUsado - a.vezesUsado || a.nome.localeCompare(b.nome)
  )
  const filtrados = termo
    ? ordenados.filter((i) => i.nome.toLowerCase().includes(termo))
    : ordenados

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

  function abrirCriarInsumo() {
    setNovoNome(busca.trim())
    setCriandoInsumo(true)
  }

  function fecharCriarInsumo() {
    setCriandoInsumo(false)
    setNovoNome('')
    setNovaCategoria('comestivel')
    setNovaUnidade('un')
    setNovoPreco('')
  }

  const { execute: criarInsumo, isExecuting: criandoInsumoAgora } = useAction(
    createEstoqueItemAction,
    {
      onSuccess: ({ data }) => {
        if (!data) return
        toast.success('Insumo cadastrado')
        // Custo unitário vem do preço digitado aqui mesmo — a query que
        // recarregaria `insumos` do servidor só roda num próximo mount do
        // formulário, então o item entra na ficha técnica com o dado que a
        // pessoa já tem na mão, sem esperar revalidação nenhuma.
        onChange({
          fichaTecnica: [
            ...fichaTecnica,
            {
              estoqueItemId: data.itemId,
              nome: novoNome.trim(),
              unidade: novaUnidade,
              quantidade: 0,
              custoUnitario: Number(novoPreco) || 0,
              tipoEscala: 'proporcional',
              overridesPorTamanho: [],
            },
          ],
        })
        setBusca('')
        fecharCriarInsumo()
      },
      onError: ({ error }) => {
        toast.error(error.serverError ?? 'Não foi possível cadastrar o insumo')
      },
    }
  )

  function confirmarCriarInsumo() {
    if (!novoNome.trim()) return
    criarInsumo({
      nome: novoNome.trim(),
      categoria: novaCategoria,
      unidade: novaUnidade,
      quantidadeAtual: 0,
      pontoReposicao: 0,
      preco: Number(novoPreco) || undefined,
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

            {criandoInsumo ? (
              <div className="flex flex-col gap-2 rounded-md border p-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Nome do insumo</Label>
                  <Input
                    value={novoNome}
                    onChange={(e) => setNovoNome(e.target.value)}
                    placeholder="Ex: Pão de hambúrguer"
                    autoFocus
                    className="h-9"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Categoria</Label>
                    <Select
                      value={novaCategoria}
                      onValueChange={(v) => setNovaCategoria(v as CategoriaEstoque)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIAS_ESTOQUE.filter((c) => c !== 'outro').map(
                          (categoria) => (
                            <SelectItem key={categoria} value={categoria}>
                              {CATEGORIA_ESTOQUE_LABEL[categoria]}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Unidade</Label>
                    <Select
                      value={novaUnidade}
                      onValueChange={(v) => setNovaUnidade(v as Unidade)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNIDADES.map((unidade) => (
                          <SelectItem key={unidade} value={unidade}>
                            {unidade}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Preço por {novaUnidade} (R$)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={novoPreco}
                    onChange={(e) => setNovoPreco(e.target.value)}
                    placeholder="0,00"
                    className="h-9"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={fecharCriarInsumo}
                    disabled={criandoInsumoAgora}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={confirmarCriarInsumo}
                    disabled={criandoInsumoAgora || !novoNome.trim()}
                  >
                    {criandoInsumoAgora ? 'Criando...' : 'Criar e adicionar'}
                  </Button>
                </div>
              </div>
            ) : (
              <>
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

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={abrirCriarInsumo}
                  className="justify-start text-muted-foreground"
                >
                  <Plus className="size-4" />
                  {busca.trim()
                    ? `Cadastrar "${busca.trim()}" como novo insumo`
                    : 'Cadastrar novo insumo'}
                </Button>
              </>
            )}
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
