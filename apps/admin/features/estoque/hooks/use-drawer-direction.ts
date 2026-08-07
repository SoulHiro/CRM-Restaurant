'use client'

import { useIsMobile } from '@repo/ui/hooks/use-mobile'

/**
 * Todo drawer do módulo entra pela direita como painel flutuante no desktop
 * (padrão do DESIGN.md), mas isso não é utilizável no celular — vira um
 * bottom sheet de borda a borda abaixo de 768px, o breakpoint que
 * `useIsMobile` já usa para a sidebar.
 */
export function useDrawerDirection() {
  const isMobile = useIsMobile()

  return isMobile
    ? { direction: 'bottom' as const, variant: 'default' as const }
    : { direction: 'right' as const, variant: 'float' as const }
}
