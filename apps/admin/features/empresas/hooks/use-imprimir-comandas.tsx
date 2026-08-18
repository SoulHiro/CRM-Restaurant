'use client'

import { useEffect, useRef, useState } from 'react'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'

import { obterConfiguracaoComandaAction } from '@/features/configuracoes/lib/actions'
import {
  CAMPOS_COMANDA_PADRAO,
  type CampoComandaKey,
} from '@/features/configuracoes/lib/types'
import { obterImpressoraComandaAction } from '../lib/actions'
import { ComandaPDF, type ComandaDados } from '../lib/comanda-pdf'

interface ImpressoraComanda {
  id: string
  nome: string
  identificadorQz: string
}

export type ComandaEntrada = Omit<ComandaDados, 'impressoEm'>

/**
 * Busca a impressora e o layout de comanda configurados uma vez, e expõe
 * `imprimir` — gera o PDF de cada comanda (com `impressoEm` calculado na
 * hora) e manda para o QZ Tray em sequência, uma por uma, para a guilhotina
 * cortar entre cada uma (ver `lib/qz-print.ts`).
 */
export function useImprimirComandas() {
  const [impressora, setImpressora] = useState<ImpressoraComanda | null>(null)
  const [campos, setCampos] = useState<CampoComandaKey[]>(CAMPOS_COMANDA_PADRAO)
  const [imprimindo, setImprimindo] = useState(false)

  const { executeAsync: buscarImpressora } = useAction(
    obterImpressoraComandaAction
  )
  const { executeAsync: buscarConfiguracao } = useAction(
    obterConfiguracaoComandaAction
  )

  // `execute()` do next-safe-action não devolve promise de verdade — só
  // `executeAsync()` espera a resposta chegar. Guardamos a promise da carga
  // inicial pra `imprimir()` sempre aguardar antes de checar `impressora`,
  // mesmo que o clique aconteça antes da busca terminar.
  const carregamentoInicial = useRef<Promise<void> | null>(null)

  useEffect(() => {
    carregamentoInicial.current = Promise.all([
      buscarImpressora({}),
      buscarConfiguracao({}),
    ]).then(([resultadoImpressora, resultadoConfig]) => {
      setImpressora(resultadoImpressora?.data?.impressora ?? null)
      if (resultadoConfig?.data?.campos) {
        setCampos(resultadoConfig.data.campos as CampoComandaKey[])
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function imprimir(comandas: ComandaEntrada[]) {
    if (comandas.length === 0) {
      toast.info('Nenhuma comanda para imprimir.')
      return
    }

    await carregamentoInicial.current

    if (!impressora) {
      toast.error(
        'Nenhuma impressora de comanda configurada. Cadastre uma em Configurações.'
      )
      return
    }

    setImprimindo(true)
    try {
      const { pdf } = await import('@react-pdf/renderer')
      const { imprimirDocumentosSequencialmente } = await import(
        '@/lib/qz-print'
      )

      const impressoEm = new Date().toISOString()
      const blobs = await Promise.all(
        comandas.map((comanda) =>
          pdf(
            <ComandaPDF comanda={{ ...comanda, impressoEm }} campos={campos} />
          ).toBlob()
        )
      )

      await imprimirDocumentosSequencialmente(
        impressora.identificadorQz,
        blobs,
        (indice, total) => {
          if (total > 1) toast.loading(`Imprimindo ${indice}/${total}...`, {
            id: 'imprimir-comandas',
          })
        }
      )

      toast.success(
        comandas.length === 1
          ? 'Comanda enviada para impressão'
          : `${comandas.length} comandas enviadas para impressão`,
        { id: 'imprimir-comandas' }
      )
    } catch {
      toast.error(
        'Não foi possível imprimir. Confira se o QZ Tray está aberto e conectado.',
        { id: 'imprimir-comandas' }
      )
    } finally {
      setImprimindo(false)
    }
  }

  return { imprimir, imprimindo, impressoraConfigurada: impressora != null }
}
