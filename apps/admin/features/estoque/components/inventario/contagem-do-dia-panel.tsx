import Link from 'next/link'
import { Check, Sunrise, Sunset } from 'lucide-react'

import { Button } from '@repo/ui/components/button'
import { cn } from '@repo/ui/lib/utils'

import { formatTimeBR } from '@/lib/formatters'
import { INVENTARIO_TIPO_LABEL } from '../../lib/types'
import type { InventarioResumo, InventarioTipo } from '../../lib/types'
import { IniciarContagemButton } from './iniciar-contagem-button'

const ICONE: Record<InventarioTipo, typeof Sunrise> = {
  abertura: Sunrise,
  fechamento: Sunset,
}

function SlotContagem({
  tipo,
  sessao,
  bloqueado,
}: {
  tipo: InventarioTipo
  sessao: InventarioResumo | null
  bloqueado: boolean
}) {
  const Icone = ICONE[tipo]
  const label = INVENTARIO_TIPO_LABEL[tipo]

  if (sessao?.status === 'finalizado') {
    return (
      <Link
        href={`/estoque/inventario/${sessao.id}`}
        className="flex items-center gap-3 rounded-xl border border-transparent bg-muted/50 p-4 text-muted-foreground transition-colors hover:bg-muted"
      >
        <Check className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <span className="flex flex-col">
          <span className="text-sm font-medium text-foreground">{label}</span>
          <span className="text-xs">
            Concluída
            {sessao.finalizadoEm
              ? ` às ${formatTimeBR(sessao.finalizadoEm)}`
              : ''}
          </span>
        </span>
      </Link>
    )
  }

  if (sessao?.status === 'em_andamento') {
    return (
      <Button
        variant="outline"
        size="lg"
        className="h-16 w-full justify-start gap-3 text-left"
        asChild
      >
        <Link href={`/estoque/inventario/${sessao.id}`}>
          <Icone className="size-5 shrink-0" />
          <span className="flex flex-col">
            <span className="text-base font-semibold">
              Continuar {label.toLowerCase()}
            </span>
            <span className="text-xs font-normal text-muted-foreground">
              {sessao.linhasContadas}/{sessao.totalLinhas} contados
            </span>
          </span>
        </Link>
      </Button>
    )
  }

  return (
    <div className={cn('flex flex-col gap-2', bloqueado && 'opacity-50')}>
      <IniciarContagemButton
        tipo={tipo}
        label={`Fazer ${label.toLowerCase()}`}
        disabled={bloqueado}
      />
    </div>
  )
}

export function ContagemDoDiaPanel({
  abertura,
  fechamento,
  itensAtivos,
}: {
  abertura: InventarioResumo | null
  fechamento: InventarioResumo | null
  itensAtivos: number
}) {
  const semItens = itensAtivos === 0

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <SlotContagem tipo="abertura" sessao={abertura} bloqueado={semItens} />
        <SlotContagem
          tipo="fechamento"
          sessao={fechamento}
          bloqueado={semItens}
        />
      </div>

      {semItens && (
        <p className="text-sm text-muted-foreground">
          Cadastre pelo menos um item de estoque antes de abrir uma contagem.
        </p>
      )}
    </div>
  )
}
