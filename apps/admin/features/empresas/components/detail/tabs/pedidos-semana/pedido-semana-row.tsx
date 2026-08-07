'use client'

import { AlertCircle, Check, Clock, Printer } from 'lucide-react'

import { Button } from '@repo/ui/components/button'
import { TableCell, TableRow } from '@repo/ui/components/table'
import { cn } from '@repo/ui/lib/utils'

import type { PedidoSemanaRow } from '../../../../lib/pedidos-semana-helpers'

const STATUS_CONFIG = {
  pendente: { label: 'Pendente', className: 'text-primary', Icon: Clock },
  impresso: { label: 'Impresso', className: 'text-sidebar', Icon: Check },
  erro_impressao: {
    label: 'Erro de impressão',
    className: 'text-destructive',
    Icon: AlertCircle,
  },
} as const

export function PedidoSemanaRowItem({
  row,
  onPrint,
}: {
  row: PedidoSemanaRow
  onPrint: () => void
}) {
  const { pedido } = row
  const status = pedido.status ?? 'pendente'
  const config = STATUS_CONFIG[status]
  const isErro = status === 'erro_impressao'

  return (
    <TableRow>
      <TableCell className="font-medium">{row.funcionarioNome}</TableCell>
      <TableCell>
        {pedido.prato}
        {pedido.tamanho && (
          <span className="text-muted-foreground"> · {pedido.tamanho}</span>
        )}
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-0.5">
          <span className={cn('flex items-center gap-1.5', config.className)}>
            <config.Icon className="size-4" />
            {config.label}
          </span>
          {isErro && pedido.motivoErro && (
            <span className="text-xs text-muted-foreground">
              {pedido.motivoErro}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant={isErro ? 'outline' : 'ghost'}
          size="icon"
          aria-label={`Imprimir pedido de ${row.funcionarioNome}`}
          className={cn(
            isErro &&
              'border-destructive text-destructive hover:text-destructive'
          )}
          onClick={onPrint}
        >
          <Printer className="size-4" />
        </Button>
      </TableCell>
    </TableRow>
  )
}
