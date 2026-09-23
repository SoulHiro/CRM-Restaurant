'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import { SeletorImpressoraDialog } from '../components/shared/seletor-impressora-dialog'
import type { ComprovanteDados } from '../lib/comprovante-pdf'
import { useImpressoraLocal } from './use-impressora-local'

const CHAVE_STORAGE = 'mesas:impressora:comprovante'

export function useImprimirComprovante() {
  const { identificador, escolher, carregado } = useImpressoraLocal(CHAVE_STORAGE)
  const [dialogAberto, setDialogAberto] = useState(false)
  const [pendente, setPendente] = useState<Omit<ComprovanteDados, 'impressoEm'> | null>(
    null
  )
  const [imprimindo, setImprimindo] = useState(false)

  async function executar(id: string, dados: Omit<ComprovanteDados, 'impressoEm'>) {
    setImprimindo(true)
    try {
      const { pdf } = await import('@react-pdf/renderer')
      const { imprimirDocumentoUnico } = await import('@/lib/qz-print')
      const { ComprovantePDF } = await import('../lib/comprovante-pdf')

      const blob = await pdf(
        <ComprovantePDF comanda={{ ...dados, impressoEm: new Date().toISOString() }} />
      ).toBlob()
      await imprimirDocumentoUnico(id, blob)
      toast.success('Comprovante impresso')
    } catch {
      toast.error(
        'Não foi possível imprimir. Confira se o QZ Tray está aberto e conectado.'
      )
    } finally {
      setImprimindo(false)
    }
  }

  async function imprimirComprovante(dados: Omit<ComprovanteDados, 'impressoEm'>) {
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
      titulo="Escolher impressora do comprovante"
      onEscolher={(id) => {
        escolher(id)
        if (pendente) void executar(id, pendente)
        setPendente(null)
      }}
    />
  )

  return { imprimirComprovante, imprimindo, dialog }
}
