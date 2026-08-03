"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  UtensilsCrossed,
  BookOpen,
  Building2,
  Users,
  CreditCard,
  BarChart3,
  Bike,
  Settings,
  UserCog,
  LogOut,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@repo/ui/components/sidebar"
import { authClient } from "@/lib/auth-client"
import type { User } from "@repo/auth"

const NAV_ITEMS = [
  { title: "Caixa",         url: "/caixa",         icon: UtensilsCrossed, roles: ["admin", "caixa", "cozinha"] },
  { title: "Cardápio",      url: "/cardapio",       icon: BookOpen,        roles: ["admin"] },
  { title: "Empresas",      url: "/empresas",       icon: Building2,       roles: ["admin", "caixa"] },
  { title: "Funcionários",  url: "/funcionarios",   icon: Users,           roles: ["admin"] },
  { title: "Fiado",         url: "/fiado",          icon: CreditCard,      roles: ["admin", "caixa", "financeiro"] },
  { title: "Placar",        url: "/placar",         icon: BarChart3,       roles: ["admin", "caixa", "financeiro"] },
  { title: "Entregadores",  url: "/entregadores",   icon: Bike,            roles: ["admin"] },
  { title: "Configurações", url: "/configuracoes",  icon: Settings,        roles: ["admin", "caixa"] },
  { title: "Usuários",      url: "/usuarios",       icon: UserCog,         roles: ["admin"] },
]

interface AppSidebarProps {
  user: User
  role?: string
}

export function AppSidebar({ user, role }: AppSidebarProps) {
  const pathname = usePathname()
  const visibleItems = NAV_ITEMS.filter(
    (item) => role && item.roles.includes(role)
  )

  async function handleSignOut() {
    await authClient.signOut()
    window.location.href = "/login"
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="px-2 py-1">
          <p className="text-sm font-semibold">Nosso Quintal</p>
          <p className="text-xs text-sidebar-foreground/50">Admin</p>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.url)}
                    tooltip={item.title}
                  >
                    <Link href={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center justify-between px-2 py-1">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-sidebar-foreground/50">{user.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="ml-2 shrink-0 rounded p-1 text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
