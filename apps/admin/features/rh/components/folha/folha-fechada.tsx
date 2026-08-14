import { CheckCircle2 } from 'lucide-react'

import { cn } from '@repo/ui/lib/utils'

import { formatCurrencyBRL, formatDateBR } from '@/lib/formatters'
import { rotuloCompetencia } from '../../lib/folha-helpers'
import type { FolhaFechada } from '../../lib/types'
import { DesfazerFolhaButton } from './desfazer-folha-button'
import { FECHADA_GRID, FolhaFechadaPessoaRow } from './folha-fechada-pessoa-row'

export function FolhaFechadaPainel({ folha }: { folha: FolhaFechada }) {
  const pagas = folha.linhas.filter((linha) => linha.contaPaga).length
  const vencimentos = folha.linhas
    .map((linha) => linha.dataVencimento)
    .sort((a, b) => a.localeCompare(b))
  const primeiroVencimento = vencimentos[0] ?? folha.dataVencimento
  const ultimoVencimento =
    vencimentos[vencimentos.length - 1] ?? folha.dataVencimento

  // Uma entrada por pessoa, preservando a ordem em que as linhas já vieram.
  const agrupadas = new Map<string, typeof folha.linhas>()
  for (const linha of folha.linhas) {
    const atual = agrupadas.get(linha.funcionarioId)
    if (atual) atual.push(linha)
    else agrupadas.set(linha.funcionarioId, [linha])
  }
  const porPessoa = [...agrupadas.entries()]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 rounded-xl bg-sidebar p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-2 text-sm text-sidebar-foreground/70">
            <CheckCircle2 className="size-4" />
            Folha de {rotuloCompetencia(folha.competencia)} fechada
          </span>
          <span className="text-3xl font-bold tabular-nums text-sidebar-foreground">
            {formatCurrencyBRL(folha.total)}
          </span>
          <span className="text-sm text-sidebar-foreground/70">
            {folha.linhas.length}{' '}
            {folha.linhas.length === 1 ? 'conta' : 'contas'} vencendo{' '}
            {primeiroVencimento === ultimoVencimento
              ? formatDateBR(primeiroVencimento)
              : `entre ${formatDateBR(primeiroVencimento)} e ${formatDateBR(ultimoVencimento)}`}{' '}
            · {pagas} {pagas === 1 ? 'quitada' : 'quitadas'}
          </span>
        </div>

        <DesfazerFolhaButton
          competencia={folha.competencia}
          qtdLinhas={folha.linhas.length}
          temContaPaga={folha.temContaPaga}
        />
      </div>

      <div
        role="table"
        aria-label={`Linhas da folha de ${rotuloCompetencia(folha.competencia)}`}
        className="flex flex-col gap-2"
      >
        <div
          role="row"
          className={cn(
            'hidden items-center gap-4 px-4 py-3 text-xs font-medium text-muted-foreground sm:grid',
            FECHADA_GRID
          )}
        >
          <span role="columnheader">Funcionário</span>
          <span role="columnheader">Referente a</span>
          <span role="columnheader">Situação</span>
          <span role="columnheader" className="text-right">
            Total
          </span>
        </div>

        {porPessoa.map(([funcionarioId, linhas]) => (
          <FolhaFechadaPessoaRow
            key={funcionarioId}
            funcionarioNome={linhas[0]!.funcionarioNome}
            linhas={linhas}
          />
        ))}
      </div>
    </div>
  )
}
