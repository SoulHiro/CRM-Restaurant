'use client'

import { useEffect, useState } from 'react'

import { Button } from '@repo/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select'

interface SeletorImpressoraDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onEscolher: (identificador: string) => void
  titulo: string
}

/** Só carrega `qz-tray` quando o diálogo abre — evita conectar sem necessidade. */
export function SeletorImpressoraDialog({
  open,
  onOpenChange,
  onEscolher,
  titulo,
}: SeletorImpressoraDialogProps) {
  const [opcoes, setOpcoes] = useState<string[]>([])
  const [selecionada, setSelecionada] = useState<string>('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setCarregando(true)
    setErro(null)
    import('@/lib/qz-print')
      .then(({ listarImpressorasDetectadas }) => listarImpressorasDetectadas())
      .then(setOpcoes)
      .catch(() =>
        setErro('Não foi possível conectar ao QZ Tray. Confira se ele está aberto.')
      )
      .finally(() => setCarregando(false))
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>
            Essa escolha fica salva só neste dispositivo.
          </DialogDescription>
        </DialogHeader>

        {erro && <p className="text-sm text-destructive">{erro}</p>}
        {!erro && (
          <Select value={selecionada} onValueChange={setSelecionada}>
            <SelectTrigger>
              <SelectValue
                placeholder={carregando ? 'Buscando impressoras...' : 'Selecione'}
              />
            </SelectTrigger>
            <SelectContent>
              {opcoes.map((nome) => (
                <SelectItem key={nome} value={nome}>
                  {nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <DialogFooter>
          <Button
            disabled={!selecionada}
            onClick={() => {
              onEscolher(selecionada)
              onOpenChange(false)
            }}
          >
            Usar essa impressora
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
