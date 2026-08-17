'use client'

import * as React from 'react'
import {
  UtensilsCrossed,
  BookOpen,
  Building2,
  Package,
  ShoppingCart,
  Wallet,
  Users,
  CreditCard,
  BarChart3,
  Bike,
  Printer,
  Settings,
  UserCog,
} from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
} from '@repo/ui/components/sidebar'
import { SidebarNav, type NavItem } from '@/components/sidebar-nav'
import { NavUser } from '@/components/nav-user'
import type { User } from '@repo/auth'

const NAV_ITEMS = [
  {
    title: 'Caixa',
    url: '/caixa',
    icon: UtensilsCrossed,
    roles: ['admin', 'caixa', 'cozinha'],
  },
  { title: 'Cardápio', url: '/cardapio', icon: BookOpen, roles: ['admin'] },
  {
    title: 'Empresas',
    url: '/empresas',
    icon: Building2,
    roles: ['admin', 'caixa'],
  },
  {
    title: 'Estoque',
    url: '/estoque',
    icon: Package,
    roles: ['admin', 'cozinha'],
  },
  {
    title: 'Financeiro',
    url: '/financeiro',
    icon: Wallet,
    roles: ['admin', 'financeiro'],
  },
  {
    title: 'Compras',
    url: '/compras',
    icon: ShoppingCart,
    roles: ['admin', 'financeiro'],
  },
  {
    title: 'Funcionários',
    url: '/funcionarios',
    icon: Users,
    roles: ['admin'],
  },
  {
    title: 'Fiado',
    url: '/fiado',
    icon: CreditCard,
    roles: ['admin', 'caixa', 'financeiro'],
  },
  {
    title: 'Placar',
    url: '/placar',
    icon: BarChart3,
    roles: ['admin', 'caixa', 'financeiro'],
  },
  { title: 'Entregadores', url: '/entregadores', icon: Bike, roles: ['admin'] },
  {
    title: 'Configurações',
    url: '/configuracoes/impressao',
    icon: Settings,
    roles: ['admin', 'caixa'],
    abreConfig: true,
  },
  { title: 'Usuários', url: '/usuarios', icon: UserCog, roles: ['admin'] },
]

const CONFIG_NAV_ITEMS: NavItem[] = [
  { title: 'Impressão', url: '/configuracoes/impressao', icon: Printer },
]

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: User
  role?: string
}

export function AppSidebar({ user, role, ...props }: AppSidebarProps) {
  const visibleItems = NAV_ITEMS.filter(
    (item) => role && item.roles.includes(role)
  )

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="px-2 py-1.5 group-data-[collapsible=icon]:hidden">
              <p className="text-sm font-semibold">Nosso Quintal</p>
              <p className="text-xs text-sidebar-foreground/50">Admin</p>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarNav items={visibleItems} configItems={CONFIG_NAV_ITEMS} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{ name: user.name, email: user.email }} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
