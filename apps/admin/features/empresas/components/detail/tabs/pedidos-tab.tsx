import { Badge } from '@repo/ui/components/badge'
import { EmptyState } from '@repo/ui/components/empty-state'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/table'

import { formatDateBR } from '@/lib/formatters'
import type { EmpresaEnvio } from '../../../lib/types'

const STATUS_LABEL: Record<EmpresaEnvio['status'], string> = {
  enviado: 'Enviado',
  confirmado: 'Confirmado',
  erro: 'Erro',
}

const STATUS_VARIANT: Record<
  EmpresaEnvio['status'],
  'default' | 'secondary' | 'destructive'
> = {
  enviado: 'secondary',
  confirmado: 'default',
  erro: 'destructive',
}

export function PedidosTab({ envios }: { envios: EmpresaEnvio[] }) {
  if (envios.length === 0) {
    return (
      <EmptyState message="Nenhum pedido enviado para essa empresa ainda." />
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Nota fiscal</TableHead>
          <TableHead>Emitida em</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {envios.map((envio) => (
          <TableRow key={envio.id}>
            <TableCell className="font-medium">
              {formatDateBR(envio.data)}
            </TableCell>
            <TableCell>
              <Badge variant={STATUS_VARIANT[envio.status]}>
                {STATUS_LABEL[envio.status]}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {envio.notaFiscalNumero ?? '—'}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {envio.notaFiscalEmitidaEm
                ? formatDateBR(envio.notaFiscalEmitidaEm)
                : '—'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
