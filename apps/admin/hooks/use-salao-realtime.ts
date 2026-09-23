'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

/**
 * Assina o canal Pusher do estabelecimento e invalida a query de comandas a
 * cada evento — atualização quase instantânea entre garçom e caixa. Se as
 * env vars públicas do Pusher não estiverem configuradas, não faz nada: o
 * `refetchInterval` de 30s do `useQuery` (ver `features/mesas/hooks/
 * use-comandas.ts`) continua funcionando sozinho como rede de segurança.
 */
export function useSalaoRealtime(organizationId: string | null) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!organizationId) return

    const key = process.env.NEXT_PUBLIC_PUSHER_KEY
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER
    if (!key || !cluster) return

    let pusher: import('pusher-js').default | undefined
    let cancelado = false

    import('pusher-js').then(({ default: Pusher }) => {
      if (cancelado) return
      pusher = new Pusher(key, { cluster })
      const canal = pusher.subscribe(`salao-${organizationId}`)
      const invalidar = () =>
        queryClient.invalidateQueries({ queryKey: ['comandas', organizationId] })

      canal.bind('comanda-aberta', invalidar)
      canal.bind('comanda-atualizada', invalidar)
      canal.bind('comanda-fechada', invalidar)
      canal.bind('comanda-cancelada', invalidar)
    })

    return () => {
      cancelado = true
      pusher?.unsubscribe(`salao-${organizationId}`)
      pusher?.disconnect()
    }
  }, [organizationId, queryClient])
}
