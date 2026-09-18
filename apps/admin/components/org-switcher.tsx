'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Check, ChevronsUpDown } from 'lucide-react'
import { toast } from 'sonner'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/ui/components/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@repo/ui/components/sidebar'
import { authClient } from '@/lib/auth-client'

export interface OrgOption {
  id: string
  name: string
}

/**
 * Troca de estabelecimento ativo — mesmo esqueleto de `nav-user.tsx`
 * (SidebarMenuButton + DropdownMenu), só que o gatilho mostra o
 * estabelecimento em vez do usuário.
 *
 * `setActive()` grava a sessão nova (banco + cookie assinado) na hora — o
 * `cookieCache` de 60s do better-auth (ver packages/auth/src/index.ts) só
 * afetaria uma aba/dispositivo diferente que já tivesse a sessão antiga em
 * cache, não esta troca em si.
 */
export function OrgSwitcher({
  organizations,
  activeOrganizationId,
}: {
  organizations: OrgOption[]
  activeOrganizationId: string | null
}) {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const ativa = organizations.find((org) => org.id === activeOrganizationId)

  function trocar(orgId: string) {
    if (orgId === activeOrganizationId) return
    startTransition(async () => {
      const { error } = await authClient.organization.setActive({
        organizationId: orgId,
      })
      if (error) {
        toast.error('Não foi possível trocar de estabelecimento')
        return
      }
      router.refresh()
    })
  }

  if (organizations.length === 0) return null

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              disabled={isPending}
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Building2 className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {ativa?.name ?? 'Selecione um estabelecimento'}
                </span>
                <span className="truncate text-xs text-sidebar-foreground/50">
                  Admin
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Estabelecimentos
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {organizations.map((org) => (
              <DropdownMenuItem
                key={org.id}
                onClick={() => trocar(org.id)}
                className="gap-2"
              >
                <Building2 className="size-4 text-muted-foreground" />
                <span className="flex-1 truncate">{org.name}</span>
                {org.id === activeOrganizationId && (
                  <Check className="size-4" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
