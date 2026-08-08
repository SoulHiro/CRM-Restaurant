import { EmptyState } from '@repo/ui/components/empty-state'
import { cn } from '@repo/ui/lib/utils'

import { formatMes } from '../../lib/dre-helpers'
import type { Transacao } from '../../lib/types'
import { LancarTransacaoDrawer } from '../form/lancar-transacao-drawer'
import { LancamentoRow } from './lancamento-row'
import { MesSelector } from './mes-selector'

const GRID_COLUMNS = 'sm:grid-cols-[2.2fr_1.2fr_1fr_1fr_5rem]'
const ROW_LAYOUT =
  'flex flex-col gap-2 p-4 sm:grid sm:items-center sm:gap-4 sm:py-3'

export function LancamentosTab({
  transacoes,
  mes,
  hoje,
}: {
  transacoes: Transacao[]
  mes: string
  hoje: string
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <MesSelector mes={mes} />
        <LancarTransacaoDrawer hoje={hoje} />
      </div>

      {transacoes.length === 0 ? (
        <EmptyState
          message={`Nenhum lançamento em ${formatMes(mes)}. Registre o que entrou e o que saiu para o resultado aparecer.`}
        />
      ) : (
        <div
          role="table"
          aria-label="Lançamentos do mês"
          className="flex flex-col gap-2"
        >
          <div
            role="row"
            className={cn(
              'hidden items-center gap-4 px-4 py-3 text-xs font-medium text-muted-foreground sm:grid',
              GRID_COLUMNS
            )}
          >
            <span role="columnheader">Descrição</span>
            <span role="columnheader">Tipo</span>
            <span role="columnheader">Data</span>
            <span role="columnheader" className="text-right">
              Valor
            </span>
            <span role="columnheader" className="sr-only">
              Ações
            </span>
          </div>

          {transacoes.map((transacao) => (
            <LancamentoRow
              key={transacao.id}
              transacao={transacao}
              hoje={hoje}
              className={cn(ROW_LAYOUT, GRID_COLUMNS)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
