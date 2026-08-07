import { cn } from '@repo/ui/lib/utils'

import type { Unidade } from '../../lib/types'

const quantidadeFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 3,
})

export function formatQuantidade(valor: number): string {
  return quantidadeFormatter.format(valor)
}

export function Quantidade({
  valor,
  unidade,
  className,
  sinal = false,
}: {
  valor: number
  unidade: Unidade
  className?: string
  sinal?: boolean
}) {
  const prefixo = sinal && valor > 0 ? '+' : ''

  return (
    <span className={cn('tabular-nums', className)}>
      {prefixo}
      {formatQuantidade(valor)}{' '}
      <span className="text-xs font-normal text-muted-foreground">
        {unidade}
      </span>
    </span>
  )
}
