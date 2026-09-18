import { headers } from 'next/headers'

import { auth } from './auth'

/**
 * Estabelecimento ativo da sessão (ver org-switcher.tsx / ARCHITECTURE.md).
 * Sem fallback pra variável de módulo — sempre lido da sessão da requisição
 * corrente (o `db` é singleton sem contexto de request, então o tenant
 * nunca pode "vazar" de uma requisição concorrente pra outra).
 *
 * Se a sessão ainda não tem um `activeOrganizationId` (usuário nunca trocou
 * pelo seletor), cai pra primeira organização que o usuário pertence — evita
 * telas de Catálogo/Estoque em branco antes da primeira troca manual.
 */
export async function getActiveOrganizationId(): Promise<string | null> {
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  if (!session) return null

  const activeId = (
    session.session as { activeOrganizationId?: string | null }
  ).activeOrganizationId
  if (activeId) return activeId

  const organizacoes = await auth.api.listOrganizations({ headers: headersList })
  return organizacoes?.[0]?.id ?? null
}
