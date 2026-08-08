import { cn } from '@repo/ui/lib/utils'

import { formatCurrencyBRL } from '@/lib/formatters'
import type { TransacaoTipo } from '../../lib/types'

/**
 * Dinheiro entrando é verde, saindo é vermelho — mesma convenção de cor que o
 * estoque usa para sobra/falta, para não haver dois vocabulários de sinal no
 * mesmo app.
 */
export function ValorMonetario({
  valor,
  tipo,
  sinal = false,
  className,
}: {
  valor: number
  tipo?: TransacaoTipo
  sinal?: boolean
  className?: string
}) {
  const prefixo = sinal ? (tipo === 'despesa' ? '−' : '+') : ''

  return (
    <span
      className={cn(
        'tabular-nums',
        tipo === 'receita' && 'text-emerald-600 dark:text-emerald-400',
        tipo === 'despesa' && 'text-destructive',
        className
      )}
    >
      {prefixo}
      {formatCurrencyBRL(valor)}
    </span>
  )
}
