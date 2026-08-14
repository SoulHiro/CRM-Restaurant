import { EmptyState } from '@repo/ui/components/empty-state'

import { formatCurrencyBRL } from '@/lib/formatters'
import { rotuloCompetencia } from '../../lib/folha-helpers'
import type { FolhaFechada, FolhaPrevia } from '../../lib/types'
import { CompetenciaSelector } from './competencia-selector'
import { FolhaFechadaPainel } from './folha-fechada'
import { FolhaPreviaEditavel } from './folha-previa'

export function FolhaTab({
  competencia,
  previa,
  fechada,
  historico,
}: {
  competencia: string
  previa: FolhaPrevia
  fechada: FolhaFechada | null
  historico: { id: string; competencia: string; total: number }[]
}) {
  return (
    <div className="flex flex-col gap-6">
      <CompetenciaSelector competencia={competencia} />

      {fechada ? (
        <FolhaFechadaPainel folha={fechada} />
      ) : previa.linhas.length === 0 ? (
        <EmptyState
          message={`Ninguém entra na folha de ${rotuloCompetencia(competencia)}. Admita a equipe e registre os salários para poder fechar o mês.`}
        />
      ) : (
        <FolhaPreviaEditavel previa={previa} />
      )}

      {historico.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            Folhas anteriores
          </h3>
          <ul className="flex flex-col gap-2">
            {historico.map((folha) => (
              <li
                key={folha.id}
                className="flex items-baseline justify-between gap-4 rounded-lg bg-card px-4 py-3"
              >
                <span className="text-sm">
                  {rotuloCompetencia(folha.competencia)}
                </span>
                <span className="text-sm font-medium tabular-nums">
                  {formatCurrencyBRL(folha.total)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
