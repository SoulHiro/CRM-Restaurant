import { Plus } from 'lucide-react'

import { Button } from '@repo/ui/components/button'
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
import type { EmpresaPausa } from '../../../lib/types'

export function PausasTab({ pausas }: { pausas: EmpresaPausa[] }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button size="sm">
          <Plus className="size-4" />
          Nova pausa
        </Button>
      </div>

      {pausas.length === 0 ? (
        <EmptyState message="Nenhuma pausa registrada." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Motivo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pausas.map((pausa) => (
              <TableRow key={pausa.id}>
                <TableCell className="font-medium">
                  {formatDateBR(pausa.data)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {pausa.motivo ?? '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
