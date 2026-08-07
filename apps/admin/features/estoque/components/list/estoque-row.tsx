'use client'

import { useRouter } from 'next/navigation'

import { cn } from '@repo/ui/lib/utils'

import { nivelEstoque } from '../../lib/estoque-helpers'
import type { EstoqueItem } from '../../lib/types'
import { MobileCellLabel } from '../shared/mobile-cell-label'
import { NivelEstoqueBadge } from '../shared/nivel-estoque-badge'
import { Quantidade } from '../shared/quantidade'
import { ValidadeBadge } from '../shared/validade-badge'

export function EstoqueRow({
  item,
  hoje,
  className,
}: {
  item: EstoqueItem
  hoje: string
  className: string
}) {
  const router = useRouter()
  const nivel = nivelEstoque(item)

  function abrirItem() {
    router.push(`/estoque/${item.id}`)
  }

  return (
    <div
      role="row"
      tabIndex={0}
      onClick={abrirItem}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          abrirItem()
        }
      }}
      className={cn(
        'cursor-pointer rounded-lg bg-card transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        !item.ativo && 'opacity-60',
        className
      )}
    >
      <span role="cell" className="flex min-w-0 flex-col">
        <span className="truncate font-medium">{item.nome}</span>
        <span className="text-xs text-muted-foreground">
          {item.ativo ? item.unidade : `${item.unidade} · desativado`}
        </span>
      </span>

      <span
        role="cell"
        className="flex items-center justify-between gap-2 sm:flex-col sm:items-end sm:gap-0.5"
      >
        <MobileCellLabel>Quantidade</MobileCellLabel>
        <span className="flex flex-col items-end gap-0.5">
          <Quantidade
            valor={item.quantidadeAtual}
            unidade={item.unidade}
            className="font-medium"
          />
          <NivelEstoqueBadge nivel={nivel} />
        </span>
      </span>

      <span
        role="cell"
        className="flex items-center justify-between gap-2 text-sm text-muted-foreground sm:block sm:text-right"
      >
        <MobileCellLabel>Repor em</MobileCellLabel>
        {item.pontoReposicao > 0 ? (
          <Quantidade
            valor={item.pontoReposicao}
            unidade={item.unidade}
            className="tabular-nums"
          />
        ) : (
          '—'
        )}
      </span>

      <span role="cell" className="flex items-center justify-between gap-2 sm:block">
        <MobileCellLabel>Validade</MobileCellLabel>
        <ValidadeBadge validade={item.validade} hoje={hoje} />
      </span>
    </div>
  )
}
