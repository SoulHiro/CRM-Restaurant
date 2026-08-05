import { Check, X } from 'lucide-react'

import { EmptyState } from '@repo/ui/components/empty-state'
import { PersonAvatar } from '@repo/ui/components/person-avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/table'

import type { EmpresaFuncionario } from '../../../lib/types'
import { AtivoInativoBadge } from '../../shared/ativo-inativo-badge'

export function FuncionariosTab({
  funcionarios,
}: {
  funcionarios: EmpresaFuncionario[]
}) {
  if (funcionarios.length === 0) {
    return <EmptyState message="Nenhum funcionário vinculado a essa empresa." />
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Setor</TableHead>
          <TableHead>Turno</TableHead>
          <TableHead>Vínculo</TableHead>
          <TableHead className="text-center">Respondeu</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {funcionarios.map((funcionario) => (
          <TableRow key={funcionario.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <PersonAvatar
                  name={funcionario.nome}
                  className="size-8"
                  fallbackClassName="text-xs font-medium"
                />
                <span className="font-medium">{funcionario.nome}</span>
              </div>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {funcionario.setor}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {funcionario.turno}
            </TableCell>
            <TableCell>
              <AtivoInativoBadge
                active={funcionario.vinculoStatus === 'ativo'}
              />
            </TableCell>
            <TableCell>
              <div className="flex justify-center">
                {funcionario.respondeuEstaSemana ? (
                  <Check className="size-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <X className="size-4 text-muted-foreground" />
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
