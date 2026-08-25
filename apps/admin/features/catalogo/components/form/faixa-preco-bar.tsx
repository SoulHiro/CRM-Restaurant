import { formatCurrencyBRL } from '@/lib/formatters'
import type { FaixasPreco } from '../../lib/precificacao-helpers'

/**
 * Trilho colorido em vez dos 3 números soltos: vermelho até a sobrevivência
 * (prejuízo), amarelo até o mínimo recomendado, verde até o máximo — com um
 * marcador na posição do preço de venda atual.
 */
export function FaixaPrecoBar({
  faixas,
  precoVenda,
}: {
  faixas: FaixasPreco
  precoVenda: number
}) {
  const escalaMax = Math.max(
    faixas.maximoRecomendado * 1.15,
    precoVenda * 1.1,
    1
  )

  const pct = (valor: number) => Math.min(100, (valor / escalaMax) * 100)

  const pctSobrevivencia = pct(faixas.minimoSobrevivencia)
  const pctMinimo = pct(faixas.minimoRecomendado)
  const pctMaximo = pct(faixas.maximoRecomendado)
  const pctPreco = pct(precoVenda)

  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted/50">
        <div
          className="absolute inset-y-0 left-0 bg-red-400/70 dark:bg-red-500/50"
          style={{ width: `${pctSobrevivencia}%` }}
        />
        <div
          className="absolute inset-y-0 bg-amber-400/70 dark:bg-amber-500/50"
          style={{
            left: `${pctSobrevivencia}%`,
            width: `${pctMinimo - pctSobrevivencia}%`,
          }}
        />
        <div
          className="absolute inset-y-0 bg-emerald-400/70 dark:bg-emerald-500/50"
          style={{
            left: `${pctMinimo}%`,
            width: `${pctMaximo - pctMinimo}%`,
          }}
        />
        <div
          className="absolute inset-y-0 bg-blue-400/70 dark:bg-blue-500/50"
          style={{ left: `${pctMaximo}%`, width: `${100 - pctMaximo}%` }}
        />
        <div
          className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-foreground shadow"
          style={{ left: `${pctPreco}%` }}
          title={`Preço atual: ${formatCurrencyBRL(precoVenda)}`}
        />
      </div>

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{formatCurrencyBRL(faixas.minimoSobrevivencia)}</span>
        <span>{formatCurrencyBRL(faixas.minimoRecomendado)}</span>
        <span>{formatCurrencyBRL(faixas.maximoRecomendado)}</span>
      </div>
    </div>
  )
}
