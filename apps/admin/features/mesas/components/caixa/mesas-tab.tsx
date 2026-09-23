'use client'

import { useState } from 'react'

import { Badge } from '@repo/ui/components/badge'
import { EmptyState } from '@repo/ui/components/empty-state'

import { useComandas } from '../../hooks/use-comandas'
import { formatDateTimeBR } from '@/lib/formatters'
import { formatarCentavosBRL } from '../../lib/dinheiro'
import type { ComandaView } from '../../lib/types'
import { FinalizarComandaDialog } from './finalizar-comanda-dialog'
import { NotasPendentesCard } from './notas-pendentes-card'

export function MesasTab({
  organizationId,
  organizationName,
  comandasIniciais,
  notasPendentes,
}: {
  organizationId: string
  organizationName: string
  comandasIniciais: ComandaView[]
  notasPendentes: ComandaView[]
}) {
  const { data: comandas } = useComandas(organizationId, comandasIniciais)
  const [selecionada, setSelecionada] = useState<ComandaView | null>(null)

  return (
    <div className="flex flex-col gap-2">
      <NotasPendentesCard notas={notasPendentes} />

      {comandas.length === 0 && (
        <EmptyState message="Nenhuma comanda aberta — assim que o garçom abrir uma em Salão, ela aparece aqui." />
      )}

      {comandas.map((comanda) => (
        <button
          key={comanda.id}
          type="button"
          onClick={() => setSelecionada(comanda)}
          className="flex items-center justify-between gap-3 rounded-md border p-3 text-left hover:bg-muted"
        >
          <div>
            <p className="font-medium">
              Comanda #{comanda.numero}
              {comanda.mesaLabel && (
                <span className="text-muted-foreground"> — {comanda.mesaLabel}</span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              Aberta às {formatDateTimeBR(comanda.abertoEm)} por {comanda.abertoPorNome}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {comanda.pagoCentavos > 0 && (
              <Badge variant="secondary">Pagamento parcial</Badge>
            )}
            <span className="text-lg font-semibold">
              {formatarCentavosBRL(comanda.totalCentavos)}
            </span>
          </div>
        </button>
      ))}

      {selecionada && (
        <FinalizarComandaDialog
          comanda={
            comandas.find((c) => c.id === selecionada.id) ?? selecionada
          }
          organizationName={organizationName}
          open={selecionada != null}
          onOpenChange={(open) => !open && setSelecionada(null)}
        />
      )}
    </div>
  )
}
