'use client'

import { useRouter } from 'next/navigation'

import { Button } from '@repo/ui/components/button'

import { authClient } from '@/lib/auth-client'

/**
 * Só aparece quando um admin está "entrando como" outro usuário
 * (`session.impersonatedBy`, coluna que o Better Auth já grava sozinho ao
 * chamar `impersonateUser`). "Voltar" restaura a sessão original do admin.
 */
export function ImpersonationBanner() {
  const router = useRouter()
  const { data } = authClient.useSession()
  const impersonatedBy = (
    data?.session as { impersonatedBy?: string | null } | undefined
  )?.impersonatedBy

  if (!impersonatedBy) return null

  async function voltar() {
    await authClient.admin.stopImpersonating()
    router.push('/usuarios')
    router.refresh()
  }

  return (
    <div className="flex items-center justify-between gap-2 bg-primary px-4 py-1.5 text-sm text-primary-foreground">
      <span>
        Você está vendo o sistema como <strong>{data?.user?.name}</strong>
      </span>
      <Button size="sm" variant="secondary" onClick={voltar}>
        Voltar para minha conta
      </Button>
    </div>
  )
}
