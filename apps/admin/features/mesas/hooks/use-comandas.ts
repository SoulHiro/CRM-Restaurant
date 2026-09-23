'use client'

import { useQuery } from '@tanstack/react-query'

import { useSalaoRealtime } from '@/hooks/use-salao-realtime'
import { getComandasAbertasAction } from '../lib/actions'
import type { ComandaView } from '../lib/types'

/**
 * Pusher (quando configurado) invalida a query na hora; o `refetchInterval`
 * de 30s é a rede de segurança pra quando um evento se perde (rede caiu, aba
 * dormiu) — ver `docs`/plano desta feature.
 */
export function useComandas(organizationId: string, dadosIniciais: ComandaView[]) {
  useSalaoRealtime(organizationId)

  return useQuery({
    queryKey: ['comandas', organizationId],
    queryFn: async () => {
      const resultado = await getComandasAbertasAction({})
      if (!resultado?.data) throw new Error('Falha ao buscar comandas')
      return resultado.data
    },
    initialData: dadosIniciais,
    refetchInterval: 30_000,
  })
}
