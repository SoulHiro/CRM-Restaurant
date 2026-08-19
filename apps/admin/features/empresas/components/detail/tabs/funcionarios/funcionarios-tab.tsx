'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAction } from 'next-safe-action/hooks'
import { Search } from 'lucide-react'
import { toast } from 'sonner'

import { EmptyState } from '@repo/ui/components/empty-state'
import { Input } from '@repo/ui/components/input'
import { Skeleton } from '@repo/ui/components/skeleton'

import {
  atualizarColaboradorAtivoAction,
  listarColaboradoresEmpresaAction,
} from '../../../../lib/actions'
import type { ColaboradorEmpresaItem } from '../../../../lib/types'
import { FuncionarioRow } from './funcionario-row'

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
        <div className="flex flex-col gap-2">
          {colaboradoresFiltrados.map((colaborador) => (
            <FuncionarioRow
              key={colaborador.id}
              colaborador={colaborador}
              onAlternarAtivo={() =>
                alternarAtivo({
                  colaboradorId: colaborador.id,
                  ativo: !colaborador.ativo,
                })
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
