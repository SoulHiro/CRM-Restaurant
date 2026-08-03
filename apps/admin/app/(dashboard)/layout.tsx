import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { SidebarProvider, SidebarInset } from "@repo/ui/components/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/login")

  return (
    <SidebarProvider>
      <AppSidebar user={session.user} role={(session.user as any).role} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}
