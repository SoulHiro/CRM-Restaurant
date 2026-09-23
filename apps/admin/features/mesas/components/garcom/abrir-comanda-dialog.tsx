'use client'

import { useState } from 'react'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'

import { Button } from '@repo/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/dialog'
import { Input } from '@repo/ui/components/input'
import { Label } from '@repo/ui/components/label'

import { abrirComandaAction } from '../../lib/actions'

export function AbrirComandaDialog({
  numero,
  open,
  onOpenChange,
  onAberta,
}: {
  numero: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onAberta: (comandaId: string) => void
}) {
  const [mesaLabel, setMesaLabel] = useState('')

  const { execute, isPending } = useAction(abrirComandaAction, {
    onSuccess: ({ data }) => {
      if (!data) return
      onAberta(data.comandaId)
      onOpenChange(false)
      setMesaLabel('')
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? 'Não foi possível abrir a comanda.')
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Abrir comanda #{numero}</DialogTitle>
          <DialogDescription>
            Mesa é opcional — só uma referência pra você lembrar onde o cliente está.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="mesa-label">Mesa (opcional)</Label>
          <Input
            id="mesa-label"
            placeholder="Ex: Mesa 12, 2º andar..."
            value={mesaLabel}
            onChange={(e) => setMesaLabel(e.target.value)}
            autoFocus
          />
        </div>

        <DialogFooter>
          <Button
            disabled={numero == null || isPending}
            onClick={() =>
              numero != null && execute({ numero, mesaLabel: mesaLabel.trim() || undefined })
            }
          >
            {isPending ? 'Abrindo...' : 'Abrir comanda'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
