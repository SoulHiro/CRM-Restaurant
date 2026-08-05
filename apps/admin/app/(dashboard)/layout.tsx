import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@repo/ui/components/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  return (
    <SidebarProvider>
      <AppSidebar
        variant="inset"
        user={session.user}
        role={(session.user as any).role}
      />
      <SidebarInset>
        <SiteHeader />
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
