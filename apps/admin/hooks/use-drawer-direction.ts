'use client'

import { useIsMobile } from '@repo/ui/hooks/use-mobile'

/**
 * Todo drawer de criar/editar do app entra pela direita como painel flutuante
 * no desktop (padrão do DESIGN.md), mas isso não é utilizável no celular —
 * vira uma folha de tela cheia abaixo de 768px, o mesmo breakpoint que
 * `useIsMobile` já usa para a sidebar. `variant: 'fullscreen'` também
 * desativa o fechar por arrastar o dedo (ver `Drawer` em
 * `@repo/ui/components/drawer`) — um formulário rolável embaixo do dedo
 * fechava sozinho por engano.
 */
export function useDrawerDirection() {
  const isMobile = useIsMobile()

  return isMobile
    ? { direction: 'bottom' as const, variant: 'fullscreen' as const }
    : { direction: 'right' as const, variant: 'float' as const }
}
