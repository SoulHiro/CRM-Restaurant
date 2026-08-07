'use client'

import { useState } from 'react'

import { Button } from '@repo/ui/components/button'
import { EmptyState } from '@repo/ui/components/empty-state'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@repo/ui/components/pagination'
import { cn } from '@repo/ui/lib/utils'

import {
  filterHistorico,
  flattenHistoricoSemanas,
} from '../../../../lib/pedidos-semana-helpers'
import type { EmpresaFuncionario } from '../../../../lib/types'
import { HistoricoDateRangePicker } from './historico-date-range-picker'
import { HistoricoSearchInput } from './historico-search-input'
import { HistoricoSemana } from './historico-semana'

export function HistoricoTab({
  funcionarios,
}: {
  funcionarios: EmpresaFuncionario[]
}) {
  const [q, setQ] = useState('')
  const [from, setFrom] = useState<string | null>(null)
  const [to, setTo] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const semanas = flattenHistoricoSemanas(funcionarios)

  if (semanas.length === 0) {
    return <EmptyState message="Nenhum pedido no histórico ainda." />
  }

  const semanasFiltradas = filterHistorico(semanas, { q, from, to })
  const totalPedidos = semanasFiltradas.reduce(
    (soma, semana) => soma + semana.rows.length,
    0
  )
  const temFiltroAtivo = q.trim() !== '' || from !== null

  const totalSemanas = semanasFiltradas.length
  const paginaAtual = Math.min(page, totalSemanas) || 1
  const semanaAtual = semanasFiltradas[paginaAtual - 1]

  function limparFiltros() {
    setQ('')
    setFrom(null)
    setTo(null)
    setPage(1)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <HistoricoSearchInput
            value={q}
            onChange={(value) => {
              setQ(value)
              setPage(1)
            }}
          />
          <HistoricoDateRangePicker
            from={from}
            to={to}
            onChange={(range) => {
              setFrom(range.from)
              setTo(range.to)
              setPage(1)
            }}
          />
        </div>

        <p className="text-sm text-muted-foreground">
          {totalPedidos} pedido{totalPedidos > 1 ? 's' : ''} em {totalSemanas}{' '}
          semana
          {totalSemanas > 1 ? 's' : ''}
        </p>
      </div>

      {!semanaAtual ? (
        <div className="flex flex-col items-center gap-3 py-6">
          <p className="text-sm text-muted-foreground">
            Nenhum pedido encontrado para esse filtro.
          </p>
          {temFiltroAtivo && (
            <Button variant="outline" size="sm" onClick={limparFiltros}>
              Limpar filtros
            </Button>
          )}
        </div>
      ) : (
        <>
          <HistoricoSemana semana={semanaAtual} />

          {totalSemanas > 1 && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">
                Semana {paginaAtual} de {totalSemanas}
              </span>

              <Pagination className="mx-0 w-auto">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      className={cn(
                        paginaAtual === 1 && 'pointer-events-none opacity-50'
                      )}
                      onClick={(e) => {
                        e.preventDefault()
                        if (paginaAtual > 1) setPage(paginaAtual - 1)
                      }}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      className={cn(
                        paginaAtual === totalSemanas &&
                          'pointer-events-none opacity-50'
                      )}
                      onClick={(e) => {
                        e.preventDefault()
                        if (paginaAtual < totalSemanas) setPage(paginaAtual + 1)
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
    </div>
  )
}
