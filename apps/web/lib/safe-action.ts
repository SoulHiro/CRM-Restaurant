import { createSafeActionClient } from 'next-safe-action'

/**
 * Sem wrapper de sessão — a página de cardápio é pública, sem login (mesmo
 * modelo do Google Forms que ela substitui). Mesmo padrão de mensagem de
 * `apps/admin/lib/safe-action.ts`: erro esperado vira `ActionError` com
 * mensagem pro usuário, qualquer outra exceção fica genérica.
 */
export class ActionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ActionError'
  }
}

const ERRO_GENERICO = 'Algo deu errado. Tente de novo.'

export const actionClient = createSafeActionClient({
  handleServerError: (error) => {
    if (error instanceof ActionError) return error.message
    console.error('[action]', error)
    return ERRO_GENERICO
  },
})
