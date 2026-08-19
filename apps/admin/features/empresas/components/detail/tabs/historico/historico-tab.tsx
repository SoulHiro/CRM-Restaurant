'use client'

import { useState } from 'react'

import { Button } from '@repo/ui/components/button'
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
} from '../../../../lib/historico-helpers'
import type { EmpresaFuncionario } from '../../../../lib/types'
import { HistoricoDateRangePicker } from './historico-date-range-picker'
import { HistoricoFechamentosSection } from './historico-fechamentos-section'
import { HistoricoSearchInput } from './historico-search-input'
import { HistoricoSemana } from './historico-semana'

export function HistoricoTab({
  empresaId,
  empresaNome,
  funcionarios,
  resumoMostraQuantidades,
}: {
  empresaId: string
  empresaNome: string
  funcionarios: EmpresaFuncionario[]
  resumoMostraQuantidades: boolean
}) {
  const [q, setQ] = useState('')
  const [from, setFrom] = useState<string | null>(null)
  const [to, setTo] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const semanas = flattenHistoricoSemanas(funcionarios)
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
    <div className="flex flex-col gap-6">
      <HistoricoFechamentosSection
        empresaId={empresaId}
        empresaNome={empresaNome}
        resumoMostraQuantidades={resumoMostraQuantidades}
      />

      {semanas.length > 0 && (
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
              {totalPedidos} pedido{totalPedidos > 1 ? 's' : ''} em{' '}
              {totalSemanas} semana
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
                            paginaAtual === 1 &&
                              'pointer-events-none opacity-50'
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
                            if (paginaAtual < totalSemanas)
                              setPage(paginaAtual + 1)
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
      )}
    </div>
  )
}
