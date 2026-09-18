import { headers } from 'next/headers'
import { createSafeActionClient } from 'next-safe-action'

import { auth } from './auth'

/**
 * Erro cuja mensagem é escrita para o usuário final e pode ser exibida no
 * toast. Qualquer outra exceção (falha de banco, bug) fica mascarada — não
 * vazamos detalhe de infraestrutura para a tela.
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

/**
 * Toda action que grava precisa saber quem gravou — o registro de perda e o
 * livro-razão de estoque guardam autor. Falha antes de tocar no banco quando
 * não há sessão.
 */
export const authActionClient = actionClient.use(async ({ next }) => {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    throw new ActionError('Sessão expirada. Entre novamente.')
  }

  return next({
    ctx: {
      user: {
        id: session.user.id as string,
        name: session.user.name as string,
        role: (session.user as { role?: string }).role,
      },
      // Estabelecimento ativo da sessão (ver org-switcher.tsx) — nullable
      // aqui de propósito: a maioria dos domínios (empresas, financeiro, RH,
      // ...) ainda não é multi-tenant e não usa isso. Quem precisa que
      // exista de verdade usa `tenantActionClient`/`adminTenantActionClient`
      // abaixo, não este client base.
      organizationId:
        (session.session as { activeOrganizationId?: string | null })
          .activeOrganizationId ?? null,
    },
  })
})

/** Só admin — usada pelas actions de gestão de usuários (aba Usuários). */
export const adminActionClient = authActionClient.use(async ({ next, ctx }) => {
  if (ctx.user.role !== 'admin') {
    throw new ActionError('Só administradores podem fazer isso.')
  }
  return next({ ctx })
})

/**
 * Exige um estabelecimento ativo — usado pelas actions de Catálogo e
 * Estoque (únicos domínios multi-tenant hoje, ver ARCHITECTURE.md).
 * `ctx.organizationId` nunca vem do client: é sempre derivado da sessão em
 * `authActionClient`, nunca de um campo do formulário.
 */
export const tenantActionClient = authActionClient.use(async ({ next, ctx }) => {
  if (!ctx.organizationId) {
    throw new ActionError('Selecione um estabelecimento.')
  }
  return next({ ctx: { ...ctx, organizationId: ctx.organizationId } })
})

/** Combina `adminActionClient` (role) com a exigência de estabelecimento ativo. */
export const adminTenantActionClient = adminActionClient.use(
  async ({ next, ctx }) => {
    if (!ctx.organizationId) {
      throw new ActionError('Selecione um estabelecimento.')
    }
    return next({ ctx: { ...ctx, organizationId: ctx.organizationId } })
  }
)
