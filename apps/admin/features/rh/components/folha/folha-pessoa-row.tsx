'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

import { MobileCellLabel } from '@repo/ui/components/mobile-cell-label'
import { cn } from '@repo/ui/lib/utils'

import { formatCurrencyBRL, formatDateBR } from '@/lib/formatters'
import type { LinhaFolhaPrevia } from '../../lib/types'

export const PESSOA_GRID = 'sm:grid-cols-[2fr_1.6fr_1fr]'

export interface GrupoPessoa {
  funcionarioNome: string
  cargoNome: string
  /** Índices das linhas desta pessoa dentro de `previa.linhas`. */
  indices: number[]
}

/**
 * Uma linha por pessoa, expansível: com 4 entregadores a folha tinha 17 linhas
 * abertas, e o que interessa de relance é quanto cada um recebe. A semana a
 * semana fica a um clique — só para conferir, o valor de cada linha já vem
 * calculado e não se edita aqui.
 */
export function FolhaPessoaRow({
  grupo,
  linhas,
}: {
  grupo: GrupoPessoa
  linhas: LinhaFolhaPrevia[]
}) {
  const [aberta, setAberta] = useState(false)

  const total = grupo.indices.reduce(
    (soma, indice) => soma + (linhas[indice]?.valor ?? 0),
    0
  )

  const diarias = grupo.indices.reduce((soma, indice) => {
    const linha = linhas[indice]
    if (linha?.tipo !== 'diaria') return soma
    return soma + (linha.quantidade ?? 0)
  }, 0)

  const semanas = grupo.indices.filter(
    (indice) => linhas[indice]?.tipo === 'diaria'
  ).length

  const extras = grupo.indices
    .filter((indice) => linhas[indice]?.tipo !== 'diaria')
    .map((indice) => linhas[indice]!.descricao)

  const resumo =
    semanas > 0
      ? [
          `${semanas} ${semanas === 1 ? 'semana' : 'semanas'} · ${diarias} ${diarias === 1 ? 'diária' : 'diárias'}`,
          ...extras,
        ].join(' + ')
      : extras.join(' + ')

  return (
    <div className="rounded-lg bg-card">
      <div
        role="row"
        tabIndex={0}
        aria-expanded={aberta}
        aria-label={
          aberta
            ? `Esconder o detalhe de ${grupo.funcionarioNome}`
            : `Ver o detalhe de ${grupo.funcionarioNome}`
        }
        onClick={() => setAberta((valor) => !valor)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            setAberta((valor) => !valor)
          }
        }}
        className={cn(
          'flex cursor-pointer flex-col gap-2 p-4 transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:grid sm:items-center sm:gap-4 sm:py-3',
          PESSOA_GRID
        )}
      >
        <span role="cell" className="flex min-w-0 items-center gap-2">
          <ChevronDown
            className={cn(
              'size-4 shrink-0 text-muted-foreground transition-transform duration-200',
              aberta && 'rotate-180'
            )}
          />
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-medium">
              {grupo.funcionarioNome}
            </span>
            <span className="text-xs text-muted-foreground">
              {grupo.cargoNome}
            </span>
          </span>
        </span>

        <span
          role="cell"
          className="flex items-center justify-between gap-2 text-sm text-muted-foreground sm:block"
        >
          <MobileCellLabel>Referente a</MobileCellLabel>
          <span className="text-right sm:text-left">{resumo}</span>
        </span>

        <span
          role="cell"
          className="flex items-center justify-between gap-2 text-sm font-medium tabular-nums sm:block sm:text-right"
        >
          <MobileCellLabel>Total</MobileCellLabel>
          {formatCurrencyBRL(total)}
        </span>
      </div>

      {aberta && (
        <div className="flex flex-col gap-2 rounded-b-lg bg-muted px-4 py-3">
          {grupo.indices.map((indice) => {
            const linha = linhas[indice]
            if (!linha) return null

            return (
              <div
                key={indice}
                className="flex flex-col gap-1 text-sm sm:grid sm:grid-cols-[1.8fr_7rem_7rem] sm:items-baseline sm:gap-3"
              >
                <span className="min-w-0 truncate">
                  {linha.descricao}
                  {linha.valorUnitario != null && (
                    <span className="ml-1.5 text-xs text-muted-foreground">
                      × {formatCurrencyBRL(linha.valorUnitario)}
                    </span>
                  )}
                </span>

                <span className="text-muted-foreground tabular-nums">
                  {formatDateBR(linha.dataVencimento)}
                </span>

                <span className="font-medium tabular-nums sm:text-right">
                  {formatCurrencyBRL(linha.valor)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
