'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeft, type LucideIcon } from 'lucide-react'

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@repo/ui/components/sidebar'
import { cn } from '@repo/ui/lib/utils'

export interface NavItem {
  title: string
  url: string
  icon?: LucideIcon
  /** Não navega — só troca a lista do sidebar pra `configItems`. */
  abreConfig?: boolean
  /** Não navega — só troca a lista do sidebar pra `catalogoItems`. */
  abreCatalogo?: boolean
}

type Modo = 'main' | 'config' | 'catalogo'
type Fase = 'idle' | 'saindo' | 'entrando'

const STAGGER_MS = 35
const DURACAO_MS = 150

/** Label do cabeçalho "← Voltar" de cada seção que não é a principal. */
const SECAO_LABEL: Record<Exclude<Modo, 'main'>, string> = {
  config: 'Configurações',
  catalogo: 'Catálogo',
}

function tempoTotal(quantidade: number) {
  return quantidade > 0 ? (quantidade - 1) * STAGGER_MS + DURACAO_MS : 0
}

/**
 * Trocar de seção (ex: entrar em Configurações ou Catálogo) troca a lista
 * inteira do sidebar, sem navegar — os itens atuais saem em escada (um por
 * um, de cima pra baixo) e só depois os da nova seção entram, também em
 * escada, com fade + slide da esquerda. A troca de rota real só acontece
 * quando o usuário clica num item de destino (ex: "Impressão"); os botões
 * de seção e o de voltar só trocam a lista, nunca a página.
 */
export function SidebarNav({
  items,
  configItems,
  catalogoItems,
}: {
  items: NavItem[]
  configItems: NavItem[]
  catalogoItems: NavItem[]
}) {
  const pathname = usePathname()

  function itensDoModo(alvo: Modo): NavItem[] {
    if (alvo === 'config') return configItems
    if (alvo === 'catalogo') return catalogoItems
    return items
  }

  /**
   * Baseado nas URLs reais dos itens de cada seção, não só no prefixo da
   * rota — algumas páginas de uma seção (ex: "Cardápio das empresas" em
   * `/cardapio`) não vivem sob o prefixo da própria seção (`/catalogo`).
   * Um prefixo cru derrubava o modo de volta pra "main" ao navegar pra
   * essas páginas, no meio de uma seção que o usuário nem saiu.
   */
  function modoDe(alvo: string): Modo {
    if (
      alvo.startsWith('/configuracoes') ||
      configItems.some((item) => alvo.startsWith(item.url))
    ) {
      return 'config'
    }
    if (
      alvo.startsWith('/catalogo') ||
      catalogoItems.some((item) => alvo.startsWith(item.url))
    ) {
      return 'catalogo'
    }
    return 'main'
  }

  const [modo, setModo] = useState<Modo>(() => modoDe(pathname))
  const [fase, setFase] = useState<Fase>('idle')
  const [entrouVisivel, setEntrouVisivel] = useState(true)
  const modoAlvoRef = useRef(modo)

  function iniciarTransicao(alvo: Modo) {
    if (alvo === modoAlvoRef.current) return
    modoAlvoRef.current = alvo
    setFase('saindo')
  }

  // Só reage a navegação que aconteceu por fora do nosso controle (link
  // direto pra dentro/fora de uma seção, voltar do navegador) — nunca é o
  // que dispara a troca quando o clique já veio do próprio sidebar.
  useEffect(() => {
    iniciarTransicao(modoDe(pathname))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    if (fase !== 'saindo') return
    const atuais = itensDoModo(modo)
    const t = setTimeout(() => {
      setModo(modoAlvoRef.current)
      setEntrouVisivel(false)
      setFase('entrando')
    }, tempoTotal(atuais.length))
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase])

  useEffect(() => {
    if (fase !== 'entrando') return
    const id = requestAnimationFrame(() => setEntrouVisivel(true))
    const novos = itensDoModo(modo)
    const t = setTimeout(() => setFase('idle'), tempoTotal(novos.length))
    return () => {
      cancelAnimationFrame(id)
      clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase, modo])

  const itensVisiveis = itensDoModo(modo)
  const saindo = fase === 'saindo'
  const cabecalhoVisivel = !saindo && entrouVisivel

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        {modo !== 'main' && (
          <button
            type="button"
            onClick={() => iniciarTransicao('main')}
            className={cn(
              'flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-left transition-all duration-150 ease-out hover:bg-sidebar-accent',
              cabecalhoVisivel
                ? 'translate-x-0 opacity-100'
                : '-translate-x-2 opacity-0'
            )}
          >
            <ArrowLeft className="size-4 shrink-0 text-sidebar-foreground/70" />
            <span className="text-xs font-medium text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
              {SECAO_LABEL[modo]}
            </span>
          </button>
        )}

        <SidebarMenu>
          {itensVisiveis.map((item, indice) => (
            <SidebarMenuItem
              key={item.title}
              className={cn(
                'ease-out',
                saindo && '-translate-y-1.5 opacity-0',
                !saindo && !entrouVisivel && '-translate-x-3 opacity-0',
                !saindo && entrouVisivel && 'translate-x-0 opacity-100'
              )}
              style={{
                transitionProperty: 'opacity, transform',
                transitionDuration: `${DURACAO_MS}ms`,
                transitionDelay: `${indice * STAGGER_MS}ms`,
              }}
            >
              {item.abreConfig || item.abreCatalogo ? (
                <SidebarMenuButton
                  type="button"
                  isActive={
                    (item.abreConfig && modo === 'config') ||
                    (item.abreCatalogo && modo === 'catalogo')
                  }
                  tooltip={item.title}
                  onClick={() =>
                    iniciarTransicao(item.abreConfig ? 'config' : 'catalogo')
                  }
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              ) : (
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith(item.url)}
                  tooltip={item.title}
                >
                  <Link href={item.url}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
