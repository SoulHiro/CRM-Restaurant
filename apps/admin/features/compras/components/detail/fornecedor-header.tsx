import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@repo/ui/components/button'

import { formatCurrencyBRL } from '@/lib/formatters'
import type { FornecedorDetalhe } from '../../lib/types'
import { AvaliacaoDrawer } from '../form/avaliacao-drawer'
import { FornecedorDrawer } from '../form/fornecedor-drawer'
import { NotaAvaliacao } from '../shared/nota-avaliacao'

export function FornecedorHeader({
  fornecedor,
  hoje,
}: {
  fornecedor: FornecedorDetalhe
  hoje: string
}) {
  const gastoTotal = fornecedor.compras
    .filter((compra) => compra.status !== 'cancelado')
    .reduce((soma, compra) => soma + compra.total, 0)

  return (
    <div className="flex w-full flex-col gap-4">
      <Button variant="ghost" size="icon" aria-label="Voltar" asChild>
        <Link href="/compras">
          <ArrowLeft className="size-4" />
        </Link>
      </Button>

      <div className="flex flex-col gap-6 rounded-xl bg-sidebar p-4 sm:p-6 lg:flex-row lg:flex-wrap lg:items-end lg:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-sidebar-foreground">
            {fornecedor.nome}
          </h1>

          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold tabular-nums text-sidebar-foreground">
              {formatCurrencyBRL(gastoTotal)}
            </span>
            <span className="text-sm text-sidebar-foreground/70">
              em {fornecedor.qtdCompras}{' '}
              {fornecedor.qtdCompras === 1 ? 'compra' : 'compras'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-sidebar-foreground/70">
            <NotaAvaliacao nota={fornecedor.mediaAvaliacao} />
            <span>
              {fornecedor.prazoEntregaDias == null
                ? 'Prazo de entrega não definido'
                : `Entrega em ${fornecedor.prazoEntregaDias} dias`}
            </span>
            <span>
              {fornecedor.prazoPagamento
                ? `Paga em ${fornecedor.prazoPagamento}`
                : 'Paga à vista'}
            </span>
            {fornecedor.contato && <span>{fornecedor.contato}</span>}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <AvaliacaoDrawer
            fornecedorId={fornecedor.id}
            fornecedorNome={fornecedor.nome}
            hoje={hoje}
          />
          <FornecedorDrawer fornecedor={fornecedor} comRotulo />
        </div>
      </div>
    </div>
  )
}
