'use client'

import { useRef, useState } from 'react'
import { ClipboardCopy, FileSpreadsheet, ListChecks, Upload } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@repo/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/dialog'

import {
  extrairConfirmadosDaPlanilha,
  formatarListaParaCopiar,
  nomesSemPedido,
  type LinhaConferencia,
} from '../../../../../lib/comparacao-conferencia-helpers'
import type { LinhaBruta } from '../../../../../lib/importacao-helpers'
import type { PedidoDoDiaItem } from '../../../../../lib/types'

export function CompararConferenciaDrawer({
  pedidos,
}: {
  pedidos: PedidoDoDiaItem[]
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [faltantes, setFaltantes] = useState<LinhaConferencia[] | null>(null)

  async function processarArquivo(arquivo: File) {
    setCarregando(true)
    try {
      const XLSX = await import('xlsx')
      const buffer = await arquivo.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })

      const abas: Record<string, LinhaBruta[]> = {}
      for (const nomeAba of workbook.SheetNames) {
        abas[nomeAba] = XLSX.utils.sheet_to_json<LinhaBruta>(
          workbook.Sheets[nomeAba]!,
          { header: 1, raw: true, defval: null }
        )
      }

      const confirmados = extrairConfirmadosDaPlanilha(abas)
      if (confirmados.length === 0) {
        toast.error(
          'Não encontrei um bloco de Almoço/Janta reconhecível nessa planilha.'
        )
        return
      }

      setFaltantes(
        nomesSemPedido(
          confirmados,
          pedidos.map((p) => ({
            nome: p.nome,
            turno: p.turno,
            recusou: p.recusou,
          }))
        )
      )
    } catch {
      toast.error('Não foi possível ler esse arquivo. Confira se é um .xlsx.')
    } finally {
      setCarregando(false)
    }
  }

  function copiar() {
    if (!faltantes) return
    navigator.clipboard.writeText(formatarListaParaCopiar(faltantes))
    toast.success('Lista copiada')
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) setFaltantes(null)
      }}
    >
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <ListChecks className="size-4" />
        Comparar planilha
      </Button>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Comparar com a conferência</DialogTitle>
          <DialogDescription>
            Envie a planilha de conferência do dia (Almoço/Janta, coluna
            Enviar/NÃO ENVIAR) — mostro quem foi confirmado lá mas ainda não
            tem pedido aqui.
          </DialogDescription>
        </DialogHeader>

        <input
          ref={inputRef}
          type="file"
          accept=".xlsx"
          className="hidden"
          onChange={(event) => {
            const arquivo = event.target.files?.[0]
            if (arquivo) void processarArquivo(arquivo)
            event.target.value = ''
          }}
        />

        {!faltantes ? (
          <div className="flex flex-col items-center justify-center gap-4 px-4 py-10 text-center">
            <div className="rounded-full bg-muted p-4">
              <FileSpreadsheet className="size-8 text-muted-foreground" />
            </div>
            <Button
              onClick={() => inputRef.current?.click()}
              disabled={carregando}
            >
              <Upload className="size-4" />
              {carregando ? 'Lendo planilha...' : 'Escolher arquivo'}
            </Button>
          </div>
        ) : faltantes.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Todo mundo confirmado na planilha já tem pedido aqui.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-md border bg-muted p-3 text-sm">
              {formatarListaParaCopiar(faltantes)}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => inputRef.current?.click()}
                disabled={carregando}
              >
                <Upload className="size-4" />
                Trocar arquivo
              </Button>
              <Button size="sm" onClick={copiar}>
                <ClipboardCopy className="size-4" />
                Copiar lista
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
