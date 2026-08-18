'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAction } from 'next-safe-action/hooks'
import { Search } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@repo/ui/components/button'
import { EmptyState } from '@repo/ui/components/empty-state'
import { Input } from '@repo/ui/components/input'
import { PersonAvatar } from '@repo/ui/components/person-avatar'
import { Skeleton } from '@repo/ui/components/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/table'

import { formatDateBR } from '@/lib/formatters'
import {
  atualizarColaboradorAtivoAction,
  listarColaboradoresEmpresaAction,
} from '../../../../lib/actions'
import type { ColaboradorEmpresaItem } from '../../../../lib/types'
import { AtivoInativoBadge } from '../../../shared/ativo-inativo-badge'

export function FuncionariosTab({ empresaId }: { empresaId: string }) {
  const [colaboradores, setColaboradores] = useState<
    ColaboradorEmpresaItem[] | null
  >(null)
  const [busca, setBusca] = useState('')

  const { execute } = useAction(listarColaboradoresEmpresaAction, {
    onSuccess: ({ data }) => setColaboradores(data?.colaboradores ?? []),
    onError: () => toast.error('Não foi possível carregar os funcionários'),
  })

  useEffect(() => {
    execute({ empresaId })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId])

  const { execute: alternarAtivo } = useAction(atualizarColaboradorAtivoAction, {
    onSuccess: ({ input }) => {
      setColaboradores((atual) =>
        (atual ?? []).map((c) =>
          c.id === input.colaboradorId ? { ...c, ativo: input.ativo } : c
        )
      )
      toast.success(input.ativo ? 'Funcionário reativado' : 'Funcionário marcado como inativo')
    },
    onError: () => toast.error('Não foi possível atualizar o funcionário'),
  })

  const colaboradoresFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return colaboradores
    return (colaboradores ?? []).filter((c) =>
      c.nome.toLowerCase().includes(termo)
    )
  }, [colaboradores, busca])

  return (
    <div className="flex flex-col gap-4">
      <div className="relative w-72">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar funcionário..."
          className="pl-8"
          value={busca}
          onChange={(event) => setBusca(event.target.value)}
        />
      </div>

      {!colaboradores ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : colaboradores.length === 0 ? (
        <EmptyState message="Nenhum funcionário vinculado a essa empresa ainda — importe uma planilha na aba Pedidos." />
      ) : !colaboradoresFiltrados || colaboradoresFiltrados.length === 0 ? (
        <EmptyState message={`Nenhum funcionário encontrado para "${busca}".`} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead>Pedidos feitos</TableHead>
              <TableHead>Último pedido</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {colaboradoresFiltrados.map((colaborador) => (
              <TableRow key={colaborador.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <PersonAvatar name={colaborador.nome} className="size-7" />
                    <span className="font-medium">{colaborador.nome}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {colaborador.whatsapp ?? '—'}
                </TableCell>
                <TableCell>{colaborador.totalPedidos}</TableCell>
                <TableCell className="text-muted-foreground">
                  {colaborador.ultimoPedidoEm
                    ? formatDateBR(colaborador.ultimoPedidoEm)
                    : '—'}
                </TableCell>
                <TableCell>
                  <AtivoInativoBadge active={colaborador.ativo} />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      alternarAtivo({
                        colaboradorId: colaborador.id,
                        ativo: !colaborador.ativo,
                      })
                    }
                  >
                    {colaborador.ativo ? 'Marcar inativo' : 'Reativar'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
