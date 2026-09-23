import 'server-only'

import Pusher from 'pusher'

let cliente: Pusher | null = null
let avisouFalta = false

/**
 * `null` quando as env vars não estão configuradas — nesse caso o app
 * inteiro continua funcionando (painel de garçom/caixa cai só no polling de
 * segurança do TanStack Query). Sem isso, esquecer de configurar o Pusher
 * em produção derrubaria toda ação de comanda com uma exceção não tratada.
 */
function getPusherClient(): Pusher | null {
  const { PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER } = process.env

  if (!PUSHER_APP_ID || !PUSHER_KEY || !PUSHER_SECRET || !PUSHER_CLUSTER) {
    if (!avisouFalta) {
      avisouFalta = true
      console.warn(
        '[pusher] PUSHER_APP_ID/KEY/SECRET/CLUSTER não configurados — atualização em tempo real do salão cai só no polling.'
      )
    }
    return null
  }

  if (!cliente) {
    cliente = new Pusher({
      appId: PUSHER_APP_ID,
      key: PUSHER_KEY,
      secret: PUSHER_SECRET,
      cluster: PUSHER_CLUSTER,
      useTLS: true,
    })
  }
  return cliente
}

export type EventoSalao =
  | 'comanda-aberta'
  | 'comanda-atualizada'
  | 'comanda-fechada'
  | 'comanda-cancelada'

/**
 * Chamado só depois de um `executarLote` bem-sucedido nas actions de
 * `features/mesas` — nunca antes, pra não notificar uma mudança que não
 * foi de fato gravada. Falha de rede com o Pusher nunca derruba a action:
 * o dado já está salvo, o pior caso é o outro dispositivo só atualizar no
 * próximo polling (30s).
 */
export async function notificarSalao(
  organizationId: string,
  evento: EventoSalao
): Promise<void> {
  const pusher = getPusherClient()
  if (!pusher) return

  try {
    await pusher.trigger(`salao-${organizationId}`, evento, {
      em: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[pusher] falha ao notificar salão', error)
  }
}
