import { StatCard } from '@repo/ui/components/stat-card'

import { resumirContagem } from '../../lib/inventario-helpers'
import type { InventarioLinha, InventarioResumo } from '../../lib/types'
import { formatQuantidade } from '../shared/quantidade'

export function InventarioResumoCard({
  resumo,
  linhas,
}: {
  resumo: InventarioResumo
  linhas: InventarioLinha[]
}) {
  const contagem = resumirContagem(linhas)
  const finalizado = resumo.status === 'finalizado'

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label={finalizado ? 'Itens conferidos' : 'Contados'}
        value={`${contagem.linhasContadas}/${contagem.totalLinhas}`}
      />
      <StatCard
        label="Divergências"
        value={String(contagem.linhasDivergentes)}
        valueClassName={
          contagem.linhasDivergentes > 0
            ? 'text-2xl font-semibold text-amber-600 dark:text-amber-400'
            : undefined
        }
      />
      <StatCard
        label="Sobrou no físico"
        value={contagem.sobra > 0 ? `+${formatQuantidade(contagem.sobra)}` : '—'}
        valueClassName={
          contagem.sobra > 0
            ? 'text-2xl font-semibold text-emerald-600 dark:text-emerald-400'
            : undefined
        }
      />
      <StatCard
        label="Faltou no físico"
        value={contagem.falta > 0 ? `−${formatQuantidade(contagem.falta)}` : '—'}
        valueClassName={
          contagem.falta > 0
            ? 'text-2xl font-semibold text-destructive'
            : undefined
        }
      />
    </div>
  )
}
