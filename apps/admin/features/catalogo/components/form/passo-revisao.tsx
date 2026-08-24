'use client'

import { useAction } from 'next-safe-action/hooks'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Button } from '@repo/ui/components/button'
import { cn } from '@repo/ui/lib/utils'

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
import {
  DISPONIBILIDADE_STATUS_LABEL,
  TIPO_PRODUTO_LABEL,
} from '../../lib/types'
import type { CriarProdutoInput } from '../../lib/types'
import type { ConfiguracaoPrecificacao } from '@/features/configuracoes/lib/types'

export function PassoRevisao({
  dados,
  configuracaoPrecificacao,
  onVoltar,
}: {
  dados: CriarProdutoInput
  configuracaoPrecificacao: ConfiguracaoPrecificacao
  onVoltar: () => void
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
  ].filter(Boolean)

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
      <div className="flex flex-col gap-3 rounded-md border p-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="font-medium">{dados.nome}</span>
          <span className="text-xs text-muted-foreground">
            {TIPO_PRODUTO_LABEL[dados.tipo]}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Ficha técnica</span>
          <span>{dados.fichaTecnica.length} insumo(s)</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Preço de venda</span>
          <span className="font-medium tabular-nums">
            {formatCurrencyBRL(dados.precoVenda)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Margem</span>
          <span className={cn('font-medium', COR_MARGEM_CLASSE[cor])}>
            {COR_MARGEM_LABEL[cor]} ({margem.toFixed(0)}%)
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Canais</span>
          <span>{canais.join(', ') || '—'}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Disponibilidade</span>
          <span>
            {DISPONIBILIDADE_STATUS_LABEL[dados.disponibilidadeStatus]}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Classificações</span>
          <span>{dados.classificacaoIds.length}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Adicionais</span>
          <span>{dados.adicionalIds.length}</span>
        </div>
      </div>

      <div className="mt-auto flex justify-between border-t pt-4">
        <Button variant="outline" onClick={onVoltar} disabled={isExecuting}>
          Voltar
        </Button>
        <Button disabled={isExecuting} onClick={() => execute(dados)}>
          {isExecuting ? 'Cadastrando...' : 'Cadastrar produto'}
        </Button>
      </div>
    </div>
  )
}
