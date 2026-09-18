import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { SidebarProvider, SidebarInset } from '@repo/ui/components/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { HeaderSlotProvider } from '@/components/header-slot'
import { SiteHeader } from '@/components/site-header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const organizacoes = await auth.api.listOrganizations({
    headers: await headers(),
  })
  const activeOrganizationId =
    (session.session as { activeOrganizationId?: string | null })
      .activeOrganizationId ?? organizacoes?.[0]?.id ?? null

  return (
    <HeaderSlotProvider>
      <SidebarProvider>
        <AppSidebar
          variant="inset"
          user={session.user}
          role={(session.user as any).role}
          organizations={(organizacoes ?? []).map(
            (org: { id: string; name: string }) => ({
              id: org.id,
              name: org.name,
            })
          )}
          activeOrganizationId={activeOrganizationId}
        />
        <SidebarInset>
          <SiteHeader />
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </HeaderSlotProvider>
  )
}
