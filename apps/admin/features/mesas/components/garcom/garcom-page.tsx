'use client'

import { useState } from 'react'

import { useComandas } from '../../hooks/use-comandas'
import type { ComandaView, ProdutoLancamento } from '../../lib/types'
import { GradeComandas } from './grade-comandas'
import { PainelLancamento } from './painel-lancamento'

export function GarcomPage({
  organizationId,
  quantidadeComandas,
  comandasIniciais,
  produtos,
}: {
  organizationId: string
  quantidadeComandas: number
  comandasIniciais: ComandaView[]
  produtos: ProdutoLancamento[]
}) {
  const { data: comandas } = useComandas(organizationId, comandasIniciais)
  const [comandaAbertaId, setComandaAbertaId] = useState<string | null>(null)

  const comandaAberta = comandas.find((c) => c.id === comandaAbertaId) ?? null

  if (comandaAberta) {
    return (
      <PainelLancamento
        comanda={comandaAberta}
        produtos={produtos}
        onVoltar={() => setComandaAbertaId(null)}
      />
    )
  }

  return (
    <GradeComandas
      quantidadeComandas={quantidadeComandas}
      comandas={comandas}
      onSelecionar={setComandaAbertaId}
    />
  )
}
