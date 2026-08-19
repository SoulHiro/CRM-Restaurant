'use client'

import { useEffect, useRef, useState } from 'react'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'

import { obterImpressoraPesagemAction } from '../lib/actions'
import { PesagemPDF, type PesagemDadosPapel } from '../lib/pesagem-pdf'

interface ImpressoraPesagem {
  id: string
  nome: string
  identificadorQz: string
}

/**
 * Mesma ideia de `useImprimirComandas`, mas pra impressora e documento de
 * pesagem — impressora dedicada (`configuracao_pesagem`), sem fallback de
 * "primeira ativa" (pesagem é opcional até configurar, comanda não).
 */
export function useImprimirPesagem() {
  const [impressora, setImpressora] = useState<ImpressoraPesagem | null>(null)
  const [imprimindo, setImprimindo] = useState(false)

  const { executeAsync: buscarImpressora } = useAction(
    obterImpressoraPesagemAction
  )

  const carregamentoInicial = useRef<Promise<void> | null>(null)

  useEffect(() => {
    carregamentoInicial.current = buscarImpressora({}).then((resultado) => {
      setImpressora(resultado?.data?.impressora ?? null)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** `true` só quando a impressão de verdade termina. */
  async function imprimirPesagem(papeis: PesagemDadosPapel[]): Promise<boolean> {
    if (papeis.length === 0) return false

    await carregamentoInicial.current

    if (!impressora) {
      toast.error(
        'Nenhuma impressora de pesagem configurada. Cadastre uma em Configurações.'
      )
      return false
    }

    setImprimindo(true)
    try {
      const { pdf } = await import('@react-pdf/renderer')
      const { imprimirDocumentosSequencialmente } = await import(
        '@/lib/qz-print'
      )

      const blobs = await Promise.all(
        papeis.map((dados) => pdf(<PesagemPDF dados={dados} />).toBlob())
      )

      await imprimirDocumentosSequencialmente(
        impressora.identificadorQz,
        blobs
      )

      toast.success(
        papeis.length === 1
          ? 'Papel de pesagem enviado para impressão'
          : `${papeis.length} papéis de pesagem enviados para impressão`,
        { id: 'imprimir-pesagem' }
      )
      return true
    } catch {
      toast.error(
        'Não foi possível imprimir. Confira se o QZ Tray está aberto e conectado.',
        { id: 'imprimir-pesagem' }
      )
      return false
    } finally {
      setImprimindo(false)
    }
  }

  return {
    imprimirPesagem,
    imprimindo,
    impressoraConfigurada: impressora != null,
  }
}
