'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import { SeletorImpressoraDialog } from '../components/shared/seletor-impressora-dialog'
import type { ComandaCozinhaDados } from '../lib/comanda-cozinha-pdf'
import { useImpressoraLocal } from './use-impressora-local'

const CHAVE_STORAGE = 'mesas:impressora:cozinha'

export function useImprimirCozinha() {
  const { identificador, escolher, carregado } = useImpressoraLocal(CHAVE_STORAGE)
  const [dialogAberto, setDialogAberto] = useState(false)
  const [pendente, setPendente] = useState<Omit<ComandaCozinhaDados, 'impressoEm'> | null>(
    null
  )
  const [imprimindo, setImprimindo] = useState(false)

  async function executar(id: string, dados: Omit<ComandaCozinhaDados, 'impressoEm'>) {
    if (dados.itens.length === 0) return
    setImprimindo(true)
    try {
      const { pdf } = await import('@react-pdf/renderer')
      const { imprimirDocumentoUnico } = await import('@/lib/qz-print')
      const { ComandaCozinhaPDF } = await import('../lib/comanda-cozinha-pdf')

      const blob = await pdf(
        <ComandaCozinhaPDF comanda={{ ...dados, impressoEm: new Date().toISOString() }} />
      ).toBlob()
      await imprimirDocumentoUnico(id, blob)
      toast.success('Comanda enviada pra cozinha')
    } catch {
      toast.error(
        'Não foi possível imprimir. Confira se o QZ Tray está aberto e conectado.'
      )
    } finally {
      setImprimindo(false)
    }
  }

  async function imprimirCozinha(dados: Omit<ComandaCozinhaDados, 'impressoEm'>) {
    if (!carregado) return
    if (!identificador) {
      setPendente(dados)
      setDialogAberto(true)
      return
    }
    await executar(identificador, dados)
  }

  const dialog = (
    <SeletorImpressoraDialog
      open={dialogAberto}
      onOpenChange={setDialogAberto}
      titulo="Escolher impressora da cozinha"
      onEscolher={(id) => {
        escolher(id)
        if (pendente) void executar(id, pendente)
        setPendente(null)
      }}
    />
  )

  return { imprimirCozinha, imprimindo, dialog }
}
