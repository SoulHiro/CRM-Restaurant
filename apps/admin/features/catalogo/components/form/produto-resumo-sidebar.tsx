'use client'

import { useAction } from 'next-safe-action/hooks'
import { useRouter } from 'next/navigation'
import { CircleDollarSign } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@repo/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card'
import { Input } from '@repo/ui/components/input'
import { Label } from '@repo/ui/components/label'
import { cn } from '@repo/ui/lib/utils'

import type { ConfiguracaoPrecificacao } from '@/features/configuracoes/lib/types'
import { formatCurrencyBRL } from '@/lib/formatters'
import { criarProdutoAction, editarProdutoAction } from '../../lib/actions'
import { limparRascunho } from '../../lib/produto-rascunho'
import {
  COR_MARGEM_CLASSE,
  COR_MARGEM_LABEL,
  calcularCustoInsumos,
  calcularCustoInsumosTamanho,
  calcularCustoProducao,
  calcularFaixasPreco,
  calcularFoodCostPercentual,
  calcularMargemPercentual,
  corMargem,
  multiplicadorPorPeso,
} from '../../lib/precificacao-helpers'
import type { CriarProdutoInput, TamanhoInput } from '../../lib/types'
import { FaixaPrecoBar } from './faixa-preco-bar'

function TamanhoResumoLinha({
  tamanho,
  pesoBaseGramas,
  dados,
  configuracaoPrecificacao,
  onChangePreco,
}: {
  tamanho: TamanhoInput
  pesoBaseGramas: number
  dados: CriarProdutoInput
  configuracaoPrecificacao: ConfiguracaoPrecificacao
  onChangePreco: (precoVenda: number) => void
}) {
  const multiplicador = multiplicadorPorPeso(tamanho.pesoGramas, pesoBaseGramas)
  const custoInsumos = calcularCustoInsumosTamanho(
    dados.fichaTecnica.map((item) => ({
      quantidade: item.quantidade,
      custoUnitario: item.custoUnitario,
      tipoEscala: item.tipoEscala,
      quantidadeFixaTamanho: item.overridesPorTamanho.find(
        (o) => o.tamanhoKey === tamanho.key
      )?.quantidade,
    })),
    multiplicador
  )
  const custoProducao = calcularCustoProducao(
    custoInsumos,
    dados.tempoMedioPreparoMinutos,
    configuracaoPrecificacao.custoOperacionalPorMinuto
  )
  const margem = calcularMargemPercentual(tamanho.precoVenda, custoProducao)
  const foodCost = calcularFoodCostPercentual(tamanho.precoVenda, custoProducao)
  const cor = corMargem(margem, {
    amareloPct: configuracaoPrecificacao.limiarAmareloPct,
    verdePct: configuracaoPrecificacao.limiarVerdePct,
    azulPct: configuracaoPrecificacao.limiarAzulPct,
    roxoPct: configuracaoPrecificacao.limiarRoxoPct,
  })

  return (
    <div className="flex flex-col gap-1 rounded-md bg-muted/50 p-2.5">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">
          {tamanho.nome || 'Tamanho'}
        </span>
        <span className="text-xs text-muted-foreground">
          {tamanho.pesoGramas}g
        </span>
        <Input
          type="number"
          min={0}
          step="0.01"
          value={tamanho.precoVenda}
          onChange={(e) => onChangePreco(Number(e.target.value))}
          className="ml-auto h-8 w-24 text-right font-semibold tabular-nums"
        />
      </div>
      <span className="text-xs text-muted-foreground">
        Custo de produção: {formatCurrencyBRL(custoProducao)} · Food cost:{' '}
        {foodCost.toFixed(0)}%
      </span>
      <span className={cn('text-xs font-medium', COR_MARGEM_CLASSE[cor])}>
        {COR_MARGEM_LABEL[cor]} — {margem.toFixed(0)}% de margem
      </span>
    </div>
  )
}

export function ProdutoResumoSidebar({
  dados,
  onChange,
  configuracaoPrecificacao,
  produtoId,
}: {
  dados: CriarProdutoInput
  onChange: (parcial: Partial<CriarProdutoInput>) => void
  configuracaoPrecificacao: ConfiguracaoPrecificacao
  produtoId?: string
}) {
  const router = useRouter()
  const editando = produtoId != null

  const { execute: criar, isExecuting: criando } = useAction(criarProdutoAction, {
    onSuccess: ({ data }) => {
      if (!data) return
      limparRascunho(produtoId)
      toast.success('Produto cadastrado')
      router.push('/catalogo/produtos')
    },
    onError: () => toast.error('Não foi possível cadastrar o produto'),
  })

  const { execute: editar, isExecuting: editandoAgora } = useAction(
    editarProdutoAction,
    {
      onSuccess: ({ data }) => {
        if (!data) return
        limparRascunho(produtoId)
        toast.success('Produto atualizado')
        router.push('/catalogo/produtos')
      },
      onError: () => toast.error('Não foi possível atualizar o produto'),
    }
  )

  const isExecuting = criando || editandoAgora
  function salvar() {
    if (editando) {
      editar({ ...dados, id: produtoId })
    } else {
      criar(dados)
    }
  }

  const custoInsumos = calcularCustoInsumos(dados.fichaTecnica)
  const custoProducao = calcularCustoProducao(
    custoInsumos,
    dados.tempoMedioPreparoMinutos,
    configuracaoPrecificacao.custoOperacionalPorMinuto
  )
  const margem = calcularMargemPercentual(dados.precoVenda, custoProducao)
  const foodCost = calcularFoodCostPercentual(dados.precoVenda, custoProducao)
  const cor = corMargem(margem, {
    amareloPct: configuracaoPrecificacao.limiarAmareloPct,
    verdePct: configuracaoPrecificacao.limiarVerdePct,
    azulPct: configuracaoPrecificacao.limiarAzulPct,
    roxoPct: configuracaoPrecificacao.limiarRoxoPct,
  })
  const faixas = calcularFaixasPreco(custoProducao, {
    minimaPct: configuracaoPrecificacao.limiarVerdePct,
    maximaPct: configuracaoPrecificacao.limiarAzulPct,
  })

  const pesoBaseGramas =
    dados.tamanhos.find((t) => t.ehBase)?.pesoGramas ??
    dados.tamanhos[0]?.pesoGramas ??
    1

  function atualizarPrecoTamanho(key: string, precoVenda: number) {
    onChange({
      tamanhos: dados.tamanhos.map((t) =>
        t.key === key ? { ...t, precoVenda } : t
      ),
    })
  }

  const podeSalvar = dados.nome.trim().length > 0

  return (
    <Card className="border-0">
      <CardHeader>
        <CardTitle className="text-base">Resumo</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <span className="truncate text-lg font-semibold">
          {dados.nome.trim() || 'Novo produto'}
        </span>

        {dados.temTamanhos ? (
          <div className="flex flex-col gap-2">
            <Label className="flex items-center gap-1.5 text-sm">
              <CircleDollarSign className="size-3.5 text-muted-foreground" />
              Preço de venda por tamanho
            </Label>
            {dados.tamanhos.map((tamanho) => (
              <TamanhoResumoLinha
                key={tamanho.key}
                tamanho={tamanho}
                pesoBaseGramas={pesoBaseGramas}
                dados={dados}
                configuracaoPrecificacao={configuracaoPrecificacao}
                onChangePreco={(precoVenda) =>
                  atualizarPrecoTamanho(tamanho.key, precoVenda)
                }
              />
            ))}
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-1.5">
              <Label className="flex items-center gap-1.5 text-sm">
                <CircleDollarSign className="size-3.5 text-muted-foreground" />
                Preço de venda
              </Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={dados.precoVenda}
                onChange={(e) =>
                  onChange({ precoVenda: Number(e.target.value) })
                }
                className="h-11 text-xl font-bold tabular-nums"
              />
              <span className="text-xs text-muted-foreground">
                Custo de produção: {formatCurrencyBRL(custoProducao)} (insumos{' '}
                {formatCurrencyBRL(custoInsumos)})
              </span>
              <span className="text-xs text-muted-foreground">
                Food cost: {foodCost.toFixed(0)}%
              </span>
              <span
                className={cn('text-sm font-medium', COR_MARGEM_CLASSE[cor])}
              >
                {COR_MARGEM_LABEL[cor]} — {margem.toFixed(0)}% de margem
              </span>
            </div>

            <FaixaPrecoBar faixas={faixas} precoVenda={dados.precoVenda} />
          </>
        )}

        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Ficha técnica</span>
            <span>{dados.fichaTecnica.length} insumo(s)</span>
          </div>
        </div>

        <Button
          className="w-full"
          disabled={!podeSalvar || isExecuting}
          onClick={salvar}
        >
          {isExecuting
            ? 'Salvando...'
            : editando
              ? 'Salvar alterações'
              : 'Cadastrar produto'}
        </Button>
      </CardContent>
    </Card>
  )
}
