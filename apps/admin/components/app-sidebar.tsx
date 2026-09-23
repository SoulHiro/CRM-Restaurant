'use client'

import * as React from 'react'
import {
  UtensilsCrossed,
  BookOpen,
  Building2,
  Clock,
  DollarSign,
  Grid2x2,
  LayoutGrid,
  Package,
  Package2,
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
  SidebarRail,
} from '@repo/ui/components/sidebar'
import { SidebarNav, type NavItem } from '@/components/sidebar-nav'
import { NavUser } from '@/components/nav-user'
import { OrgSwitcher, type OrgOption } from '@/components/org-switcher'
import type { User } from '@repo/auth'

const NAV_ITEMS = [
  {
    title: 'Caixa',
    url: '/caixa',
    icon: UtensilsCrossed,
    roles: ['admin', 'caixa', 'cozinha'],
  },
  {
    title: 'Salão',
    url: '/mesas',
    icon: Grid2x2,
    roles: ['admin', 'garcom'],
  },
  {
    title: 'Catálogo',
    url: '/cardapio',
    icon: LayoutGrid,
    roles: ['admin', 'caixa'],
    abreCatalogo: true,
  },
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
    roles: ['admin', 'cozinha', 'estoquista'],
  },
  {
    title: 'Financeiro',
    url: '/financeiro',
    icon: Wallet,
    roles: ['admin', 'financeiro', 'tesoureiro'],
  },
  {
    title: 'Compras',
    url: '/compras',
    icon: ShoppingCart,
    roles: ['admin', 'financeiro', 'gestor_compras'],
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
    roles: ['admin', 'financeiro', 'tesoureiro'],
  },
  {
    title: 'Placar',
    url: '/placar',
    icon: BarChart3,
    roles: ['admin', 'financeiro'],
  },
  {
    title: 'Entregadores',
    url: '/entregadores',
    icon: Bike,
    roles: ['admin', 'entregador'],
  },
  {
    title: 'Configurações',
    url: '/configuracoes/impressao',
    icon: Settings,
    roles: ['admin'],
    abreConfig: true,
  },
  { title: 'Usuários', url: '/usuarios', icon: UserCog, roles: ['admin'] },
]

const CONFIG_NAV_ITEMS: NavItem[] = [
  { title: 'Impressão', url: '/configuracoes/impressao', icon: Printer },
  {
    title: 'Dados da empresa',
    url: '/configuracoes/dados-empresa',
    icon: Building2,
  },
  { title: 'Funcionamento', url: '/configuracoes/funcionamento', icon: Clock },
  {
    title: 'Precificação',
    url: '/configuracoes/precificacao',
    icon: DollarSign,
  },
]

// "Insumos" não tem item aqui de propósito — apontava pra `/estoque`, a
// mesma URL do item de topo "Estoque" (`NAV_ITEMS`). Dois caminhos pro mesmo
// lugar, e o pior: por não começar com `/catalogo`, clicar nele derrubava o
// sidebar de volta pro modo "main" no meio da navegação (ver `modoDe` em
// sidebar-nav.tsx). "Estoque" no menu principal já cobre isso.
//
// "Cardápio de delivery" e "Adicionais" também saíram — eram o esqueleto de
// um cardápio digital pro cliente pedir direto (vitrine + upsell de
// pedido), fora do escopo deste sistema: aqui é só custo, estoque e gestão.
// Cardápio pro cliente fica pra uma parceria futura com a Brendi.
const CATALOGO_NAV_ITEMS: NavItem[] = [
  { title: 'Cardápio das empresas', url: '/cardapio', icon: BookOpen },
  { title: 'Produtos', url: '/catalogo/produtos', icon: Package2 },
]

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: User
  role?: string
  organizations: OrgOption[]
  activeOrganizationId: string | null
}

export function AppSidebar({
  user,
  role,
  organizations,
  activeOrganizationId,
  ...props
}: AppSidebarProps) {
  const visibleItems = NAV_ITEMS.filter(
    (item) => role && item.roles.includes(role)
  )

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <OrgSwitcher
          organizations={organizations}
          activeOrganizationId={activeOrganizationId}
        />
      </SidebarHeader>
      <SidebarContent>
        <SidebarNav
          items={visibleItems}
          configItems={CONFIG_NAV_ITEMS}
          catalogoItems={CATALOGO_NAV_ITEMS}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{ name: user.name, email: user.email }} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
