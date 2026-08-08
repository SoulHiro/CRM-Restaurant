import { EmptyState } from '@repo/ui/components/empty-state'

import { formatDateBR } from '@/lib/formatters'
import type { AvaliacaoFornecedor } from '../../../lib/types'
import { AVALIACAO_TIPO_LABEL } from '../../../lib/fornecedor-helpers'
import { NotaAvaliacao } from '../../shared/nota-avaliacao'

export function AvaliacoesTab({
  avaliacoes,
}: {
  avaliacoes: AvaliacaoFornecedor[]
}) {
  if (avaliacoes.length === 0) {
    return (
      <EmptyState message="Nenhuma avaliação ainda. Anote o atraso ou o produto ruim na hora que acontecer — é isso que forma a média." />
    )
  }

  return (
    <ul className="flex flex-col gap-2">
      {avaliacoes.map((avaliacao) => (
        <li
          key={avaliacao.id}
          className="flex flex-col gap-2 rounded-lg bg-card p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6"
        >
          <div className="flex min-w-0 flex-col gap-1">
            <span className="font-medium">{AVALIACAO_TIPO_LABEL[avaliacao.tipo]}</span>
            {avaliacao.observacao && (
              <span className="text-sm text-muted-foreground">
                {avaliacao.observacao}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {formatDateBR(avaliacao.data)}
              {avaliacao.responsavel ? ` · ${avaliacao.responsavel}` : ''}
            </span>
          </div>

          <NotaAvaliacao nota={avaliacao.nota} className="shrink-0" />
        </li>
      ))}
    </ul>
  )
}
