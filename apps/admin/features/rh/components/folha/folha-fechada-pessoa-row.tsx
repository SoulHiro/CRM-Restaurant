'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

import { MobileCellLabel } from '@repo/ui/components/mobile-cell-label'
import { cn } from '@repo/ui/lib/utils'

import {
  formatCurrencyBRL,
  formatDateBR,
  formatShortDateBR,
} from '@/lib/formatters'
import type { LinhaFolha } from '../../lib/types'

export const FECHADA_GRID = 'sm:grid-cols-[2fr_1.6fr_1.2fr_1fr]'

/**
 * Mesma compactação da prévia: uma linha por pessoa, o detalhe semana a semana
 * a um clique. Aqui o que interessa em cada semana é se a conta já foi paga.
 */
export function FolhaFechadaPessoaRow({
  funcionarioNome,
  linhas,
}: {
  funcionarioNome: string
  linhas: LinhaFolha[]
}) {
  const [aberta, setAberta] = useState(false)

  const total = linhas.reduce((soma, linha) => soma + linha.valor, 0)
  const pagas = linhas.filter((linha) => linha.contaPaga).length
  const vencimentos = linhas
    .map((linha) => linha.dataVencimento)
    .sort((a, b) => a.localeCompare(b))
  const primeiro = vencimentos[0]!
  const ultimo = vencimentos[vencimentos.length - 1]!

  return (
    <div className="rounded-lg bg-card">
      <div
        role="row"
        tabIndex={0}
        aria-expanded={aberta}
        aria-label={
          aberta
            ? `Esconder as contas de ${funcionarioNome}`
            : `Ver as contas de ${funcionarioNome}`
        }
        onClick={() => setAberta((valor) => !valor)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            setAberta((valor) => !valor)
          }
        }}
        className={cn(
          'cursor-pointer flex flex-col gap-2 p-4 transition-colors hover:bg-accent/50 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none sm:grid sm:items-center sm:gap-4 sm:py-3',
          FECHADA_GRID
        )}
      >
        <span role="cell" className="flex min-w-0 items-center gap-2">
          <ChevronDown
            className={cn(
              'size-4 shrink-0 text-muted-foreground transition-transform duration-200',
              aberta && 'rotate-180'
            )}
          />
          <span className="min-w-0 truncate font-medium">
            {funcionarioNome}
          </span>
        </span>

        <span
          role="cell"
          className="flex items-center justify-between gap-2 text-sm text-muted-foreground sm:block"
        >
          <MobileCellLabel>Referente a</MobileCellLabel>
          <span className="text-right sm:text-left">
            {linhas.length} {linhas.length === 1 ? 'conta' : 'contas'}
            {primeiro !== ultimo && (
              <span className="block text-xs">
                {formatShortDateBR(primeiro)} a {formatShortDateBR(ultimo)}
              </span>
            )}
          </span>
        </span>

        <span
          role="cell"
          className="flex items-center justify-between gap-2 sm:block"
        >
          <MobileCellLabel>Situação</MobileCellLabel>
          <span
            className={cn(
              'inline-flex items-center gap-2 text-xs font-medium',
              pagas === linhas.length
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-amber-600 dark:text-amber-400'
            )}
          >
            <span
              className={cn(
                'size-1.5 shrink-0 rounded-full',
                pagas === linhas.length ? 'bg-emerald-500' : 'bg-amber-500'
              )}
            />
            {pagas === linhas.length
              ? 'Tudo pago'
              : `${pagas} de ${linhas.length} pagas`}
          </span>
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
        <ul className="flex flex-col gap-1.5 rounded-b-lg bg-muted px-4 py-3">
          {linhas.map((linha) => (
            <li
              key={linha.id}
              className="flex flex-col gap-1 text-sm sm:grid sm:grid-cols-[1.8fr_6rem_7rem_7rem] sm:items-baseline sm:gap-3"
            >
              <span className="min-w-0 truncate">{linha.descricao}</span>

              <span
                className={cn(
                  'text-xs font-medium',
                  linha.contaPaga
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400'
                )}
              >
                {linha.contaPaga ? 'Paga' : 'Em aberto'}
              </span>

              <span className="text-muted-foreground tabular-nums">
                {formatDateBR(linha.dataVencimento)}
              </span>

              <span className="font-medium tabular-nums sm:text-right">
                {formatCurrencyBRL(linha.valor)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
