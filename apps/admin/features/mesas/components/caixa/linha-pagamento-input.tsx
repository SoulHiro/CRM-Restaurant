'use client'

import { X } from 'lucide-react'

import { Button } from '@repo/ui/components/button'
import { Input } from '@repo/ui/components/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select'

import { FORMA_PAGAMENTO_LABEL, FORMAS_PAGAMENTO, type FormaPagamento } from '../../lib/types'

export interface LinhaPagamento {
  forma: FormaPagamento
  valorReais: string
}

export function LinhaPagamentoInput({
  linha,
  onChange,
  onRemover,
  removivel,
}: {
  linha: LinhaPagamento
  onChange: (linha: LinhaPagamento) => void
  onRemover: () => void
  removivel: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <Select
        value={linha.forma}
        onValueChange={(forma) => onChange({ ...linha, forma: forma as FormaPagamento })}
      >
        <SelectTrigger className="w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FORMAS_PAGAMENTO.map((forma) => (
            <SelectItem key={forma} value={forma}>
              {FORMA_PAGAMENTO_LABEL[forma]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        value={linha.valorReais}
        onChange={(e) => onChange({ ...linha, valorReais: e.target.value })}
        inputMode="decimal"
        placeholder="0,00"
        className="flex-1"
      />

      <Button
        variant="ghost"
        size="icon"
        className="size-8 shrink-0"
        disabled={!removivel}
        onClick={onRemover}
      >
        <X className="size-4" />
      </Button>
    </div>
  )
}
