'use client'

import { useEffect, useState } from 'react'

import type { ComandaDados } from '@/features/empresas/lib/comanda-pdf'
import type { CampoComandaKey } from '../lib/types'

const COMANDA_EXEMPLO: ComandaDados = {
  nome: 'Nome do Colaborador',
  empresaNome: 'Nome da Empresa',
  turno: 'almoco',
  tamanho: 'M',
  prato: 'Prato escolhido do dia',
  observacao: 'Observação de exemplo, ex: sem cebola',
  respondidoEm: new Date().toISOString(),
  impressoEm: new Date().toISOString(),
}

/**
 * Gera o mesmo PDF que sai na impressora e mostra num iframe sem chrome de
 * visualizador — a moldura branca com sombra é o suficiente pra comunicar
 * "isso é a bobina física", sem precisar de um desenho de impressora.
 */
export function ComandaPreview({ campos }: { campos: CampoComandaKey[] }) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let ativo = true
    let urlAnterior: string | null = null

    async function gerar() {
      const [{ pdf }, { ComandaPDF }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('@/features/empresas/lib/comanda-pdf'),
      ])
      const blob = await pdf(
        <ComandaPDF comanda={COMANDA_EXEMPLO} campos={campos} />
      ).toBlob()
      if (!ativo) return
      const novaUrl = URL.createObjectURL(blob)
      urlAnterior = novaUrl
      setUrl(novaUrl)
    }

    void gerar()

    return () => {
      ativo = false
      if (urlAnterior) URL.revokeObjectURL(urlAnterior)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(campos)])

  return (
    <div className="flex flex-1 items-start justify-center overflow-auto bg-muted p-8">
      <div className="w-[240px] shrink-0 overflow-hidden rounded-sm bg-white shadow-lg">
        {url ? (
          <iframe
            title="Pré-visualização da comanda"
            src={`${url}#toolbar=0&navpanes=0&scrollbar=0`}
            className="h-[420px] w-full border-0"
          />
        ) : (
          <div className="h-[420px] w-full animate-pulse bg-zinc-100" />
        )}
      </div>
    </div>
  )
}
