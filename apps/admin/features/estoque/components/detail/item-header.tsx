import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@repo/ui/components/button'

import { formatDateBR } from '@/lib/formatters'
import { DIAS_ALERTA_VENCIMENTO, diasAteVencer, nivelEstoque } from '../../lib/estoque-helpers'
import type { EstoqueItem } from '../../lib/types'
import { AjustarQuantidadeDrawer } from '../form/ajustar-quantidade-drawer'
import { EditarItemDrawer } from '../form/editar-item-drawer'
import { RegistrarPerdaDrawer } from '../form/registrar-perda-drawer'
import { DesativarItemButton } from './desativar-item-button'
import { NivelEstoqueBadge } from '../shared/nivel-estoque-badge'
import { formatQuantidade } from '../shared/quantidade'

function textoValidade(validade: string | null, hoje: string): string | null {
  if (!validade) return null
  const dias = diasAteVencer(validade, hoje)
  if (dias < 0) return `Venceu em ${formatDateBR(validade)}`
  if (dias <= DIAS_ALERTA_VENCIMENTO)
    return `Vence em ${formatDateBR(validade)} — faltam ${dias}d`
  return `Vence em ${formatDateBR(validade)}`
}

export function ItemHeader({
  item,
  hoje,
}: {
  item: EstoqueItem
  hoje: string
}) {
  const nivel = nivelEstoque(item)
  const validade = textoValidade(item.validade, hoje)

  return (
    <div className="flex w-full flex-col gap-4">
      <Button variant="ghost" size="icon" aria-label="Voltar" asChild>
        <Link href="/estoque">
          <ArrowLeft className="size-4" />
        </Link>
      </Button>

      <div className="flex flex-col gap-6 rounded-xl bg-sidebar p-4 sm:p-6 lg:flex-row lg:flex-wrap lg:items-end lg:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-sidebar-foreground">
              {item.nome}
            </h1>
            {!item.ativo && (
              <span className="rounded-md bg-sidebar-accent px-2.5 py-0.5 text-xs font-semibold text-sidebar-accent-foreground">
                Desativado
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold tabular-nums text-sidebar-foreground">
              {formatQuantidade(item.quantidadeAtual)}
            </span>
            <span className="text-sm text-sidebar-foreground/70">
              {item.unidade} em estoque
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-sidebar-foreground/70">
            <NivelEstoqueBadge nivel={nivel} />
            <span>
              {item.pontoReposicao > 0
                ? `Repor em ${formatQuantidade(item.pontoReposicao)} ${item.unidade}`
                : 'Sem ponto de reposição'}
            </span>
            {validade && <span>{validade}</span>}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <AjustarQuantidadeDrawer item={item} />
          <RegistrarPerdaDrawer item={item} hoje={hoje} />
          <EditarItemDrawer item={item} />
          <DesativarItemButton item={item} />
        </div>
      </div>
    </div>
  )
}
