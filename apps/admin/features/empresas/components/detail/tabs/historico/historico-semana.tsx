import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/table'

import { formatDateBR } from '@/lib/formatters'
import type { SemanaAgrupada } from '../../../../lib/historico-helpers'

const STATUS_LABEL: Record<string, string> = {
  pendente: 'Pendente',
  impresso: 'Impresso',
  erro_impressao: 'Erro de impressão',
}

export function HistoricoSemana({ semana }: { semana: SemanaAgrupada }) {
  return (
    <div className="overflow-hidden rounded-lg bg-card">
      <div className="flex items-center justify-between px-4 py-3">
        <span className="font-medium">{semana.semanaLabel}</span>
        <span className="text-sm text-muted-foreground">
          {semana.rows.length} pedido{semana.rows.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="bg-muted px-2 py-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Funcionário</TableHead>
              <TableHead>Dia</TableHead>
              <TableHead>Prato</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {semana.rows.map((row) => (
              <TableRow key={`${row.funcionarioId}-${row.pedido.dia}`}>
                <TableCell className="font-medium">
                  {row.funcionarioNome}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{row.pedido.diaSemanaLabel}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateBR(row.pedido.dia)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {row.pedido.prato}
                  {row.pedido.tamanho && (
                    <span className="text-muted-foreground">
                      {' '}
                      · {row.pedido.tamanho}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {row.pedido.status ? STATUS_LABEL[row.pedido.status] : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
