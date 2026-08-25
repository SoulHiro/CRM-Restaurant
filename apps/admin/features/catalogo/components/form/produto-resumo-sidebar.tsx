'use client'

import { useAction } from 'next-safe-action/hooks'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Badge } from '@repo/ui/components/badge'
import { Button } from '@repo/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card'
import { cn } from '@repo/ui/lib/utils'

import type { ConfiguracaoPrecificacao } from '@/features/configuracoes/lib/types'
import { formatCurrencyBRL } from '@/lib/formatters'
import { criarProdutoAction } from '../../lib/actions'
import {
  COR_MARGEM_CLASSE,
  COR_MARGEM_LABEL,
  calcularCustoInsumos,
  calcularCustoProducao,
  calcularMargemPercentual,
  corMargem,
} from '../../lib/precificacao-helpers'
import type { CriarProdutoInput } from '../../lib/types'

export function ProdutoResumoSidebar({
  dados,
  configuracaoPrecificacao,
}: {
  dados: CriarProdutoInput
  configuracaoPrecificacao: ConfiguracaoPrecificacao
}) {
  const router = useRouter()

  const { execute, isExecuting } = useAction(criarProdutoAction, {
    onSuccess: ({ data }) => {
      if (!data) return
      toast.success('Produto cadastrado')
      router.push('/catalogo/produtos')
    },
    onError: () => toast.error('Não foi possível cadastrar o produto'),
  })

  const custoInsumos = calcularCustoInsumos(dados.fichaTecnica)
  const custoProducao = calcularCustoProducao(
    custoInsumos,
    dados.tempoMedioPreparoMinutos,
    configuracaoPrecificacao.custoOperacionalPorMinuto
  )
  const margem = calcularMargemPercentual(dados.precoVenda, custoProducao)
  const cor = corMargem(margem, {
    amareloPct: configuracaoPrecificacao.limiarAmareloPct,
    verdePct: configuracaoPrecificacao.limiarVerdePct,
    azulPct: configuracaoPrecificacao.limiarAzulPct,
    roxoPct: configuracaoPrecificacao.limiarRoxoPct,
  })

  const canais = [
    dados.disponivelDelivery && 'Delivery',
    dados.disponivelLocal && 'Local',
  ].filter(Boolean) as string[]

  const podeSalvar = dados.nome.trim().length > 0

  return (
    <Card className="border-0 lg:sticky lg:top-6">
      <CardHeader>
        <CardTitle className="text-base">Resumo</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <span className="truncate text-lg font-semibold">
            {dados.nome.trim() || 'Novo produto'}
          </span>
          <span className="text-2xl font-bold tabular-nums">
            {formatCurrencyBRL(dados.precoVenda)}
          </span>
          <span className={cn('text-sm font-medium', COR_MARGEM_CLASSE[cor])}>
            {COR_MARGEM_LABEL[cor]} — {margem.toFixed(0)}% de margem
          </span>
        </div>

        <div className="flex flex-col gap-2 border-t pt-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Ficha técnica</span>
            <span>{dados.fichaTecnica.length} insumo(s)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Canais</span>
            <div className="flex gap-1">
              {canais.length === 0 ? (
                <span>—</span>
              ) : (
                canais.map((canal) => (
                  <Badge key={canal} variant="outline">
                    {canal}
                  </Badge>
                ))
              )}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Classificações</span>
            <span>{dados.classificacoes.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Grupos de adicionais</span>
            <span>{dados.grupoAdicionalIds.length}</span>
          </div>
        </div>

        <Button
          className="w-full"
          disabled={!podeSalvar || isExecuting}
          onClick={() => execute(dados)}
        >
          {isExecuting ? 'Cadastrando...' : 'Cadastrar produto'}
        </Button>
      </CardContent>
    </Card>
  )
}
