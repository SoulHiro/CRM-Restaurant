'use client'

import { useCallback, useEffect, useState } from 'react'

/**
 * Escolha de impressora por dispositivo, não por usuário nem por
 * organização — o terminal da cozinha sempre imprime na impressora da
 * cozinha, o do caixa na dele, independente de quem está logado. Guardada
 * em `localStorage`, nunca no banco.
 */
export function useImpressoraLocal(chave: string) {
  const [identificador, setIdentificador] = useState<string | null>(null)
  const [carregado, setCarregado] = useState(false)

  useEffect(() => {
    setIdentificador(localStorage.getItem(chave))
    setCarregado(true)
  }, [chave])

  const escolher = useCallback(
    (id: string) => {
      localStorage.setItem(chave, id)
      setIdentificador(id)
    },
    [chave]
  )

  return { identificador, escolher, carregado }
}
