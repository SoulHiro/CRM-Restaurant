'use client'

import { useRef, useState } from 'react'
import { FileSpreadsheet, Upload } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@repo/ui/components/button'

import type { LinhaBruta, PlanilhaLida } from './importar-planilha-types'

export function PassoUpload({
  onLida,
}: {
  onLida: (planilha: PlanilhaLida) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [carregando, setCarregando] = useState(false)

  async function processarArquivo(arquivo: File) {
    setCarregando(true)
    try {
      const XLSX = await import('xlsx')
      const buffer = await arquivo.arrayBuffer()
      // cellDates faz a coluna de carimbo virar Date de verdade em vez de
      // número serial do Excel; raw:true preserva esse Date (raw:false
      // reformataria tudo — inclusive o carimbo — como texto).
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
      const primeiraAba = workbook.SheetNames[0]
      if (!primeiraAba) {
        toast.error('A planilha não tem nenhuma aba.')
        return
      }

      const planilha = workbook.Sheets[primeiraAba]!
      const matriz = XLSX.utils.sheet_to_json<LinhaBruta>(planilha, {
        header: 1,
        raw: true,
        defval: '',
      })

      const [cabecalho, ...linhas] = matriz
      if (!cabecalho || linhas.length === 0) {
        toast.error('Não encontrei linhas de dados na planilha.')
        return
      }

      onLida({ arquivoNome: arquivo.name, cabecalho, linhas })
    } catch {
      toast.error('Não foi possível ler esse arquivo. Confira se é um .xlsx.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-12 text-center">
      <div className="rounded-full bg-muted p-4">
        <FileSpreadsheet className="size-8 text-muted-foreground" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="font-medium">Planilha de respostas (.xlsx)</p>
        <p className="text-sm text-muted-foreground">
          Exportada do Google Forms — uma linha por pessoa, por semana.
        </p>
      </div>

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

      <Button
        onClick={() => inputRef.current?.click()}
        disabled={carregando}
      >
        <Upload className="size-4" />
        {carregando ? 'Lendo planilha...' : 'Escolher arquivo'}
      </Button>
    </div>
  )
}
