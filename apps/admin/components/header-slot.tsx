'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

interface HeaderSlotValue {
  left: ReactNode
  center: ReactNode
  right: ReactNode
  setLeft: (node: ReactNode) => void
  setCenter: (node: ReactNode) => void
  setRight: (node: ReactNode) => void
}

const HeaderSlotContext = createContext<HeaderSlotValue | null>(null)

/**
 * `SiteHeader` é compartilhado por toda página do dashboard e não sabe nada
 * de empresa/pedido/o-que-for — só sabe renderizar o que o contexto tiver.
 * Uma página que precisa de conteúdo próprio no header (ex: nome/CNPJ da
 * empresa centralizados, ícones de ação à direita) usa `<SetHeaderContent>`
 * pra publicar ali, sem o header genérico precisar conhecer cada tela que
 * existe.
 */
export function HeaderSlotProvider({ children }: { children: ReactNode }) {
  const [left, setLeft] = useState<ReactNode>(null)
  const [center, setCenter] = useState<ReactNode>(null)
  const [right, setRight] = useState<ReactNode>(null)

  return (
    <HeaderSlotContext.Provider
      value={{ left, center, right, setLeft, setCenter, setRight }}
    >
      {children}
    </HeaderSlotContext.Provider>
  )
}

function useHeaderSlot(): HeaderSlotValue {
  const contexto = useContext(HeaderSlotContext)
  if (!contexto) {
    throw new Error('useHeaderSlot precisa estar dentro de HeaderSlotProvider')
  }
  return contexto
}

/** Só o que `SiteHeader` lê pra renderizar — nunca escreve. */
export function useHeaderSlotContent() {
  const { left, center, right } = useHeaderSlot()
  return { left, center, right }
}

/**
 * Publica `left`/`center`/`right` no header do sidebar inset enquanto a
 * página que renderizou isso estiver montada — limpa sozinho ao desmontar
 * (troca de página), pra um header específico de uma tela não vazar pra
 * outra.
 */
export function SetHeaderContent({
  left,
  center,
  right,
}: {
  left?: ReactNode
  center?: ReactNode
  right?: ReactNode
}) {
  const { setLeft, setCenter, setRight } = useHeaderSlot()

  useEffect(() => {
    setLeft(left ?? null)
    return () => setLeft(null)
  }, [left, setLeft])

  useEffect(() => {
    setCenter(center ?? null)
    return () => setCenter(null)
  }, [center, setCenter])

  useEffect(() => {
    setRight(right ?? null)
    return () => setRight(null)
  }, [right, setRight])

  return null
}
