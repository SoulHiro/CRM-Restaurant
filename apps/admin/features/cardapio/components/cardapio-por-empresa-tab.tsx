'use client'

import { useState } from 'react'

import { Input } from '@repo/ui/components/input'
import { Label } from '@repo/ui/components/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select'

import { hojeISO } from '@/lib/formatters'
import { somarDiasISO } from '@/lib/dates'
import { CardapioTabela } from './cardapio-tabela'
import { ExtrasEmpresaSection } from './extras-empresa-section'

function inicioDaSemana(): string {
  const hoje = new Date(`${hojeISO()}T00:00:00Z`)
  const diaSemana = hoje.getUTCDay()
  const voltarPraSegunda = diaSemana === 0 ? 6 : diaSemana - 1
  return somarDiasISO(hojeISO(), -voltarPraSegunda)
}

interface EmpresaOption {
  id: string
  nome: string
  cardapioQtdAlternativas: number
}

/**
 * Uma empresa, um período — o mesmo contexto alimenta tanto a visão do
 * cardápio comum (`CardapioTabela`) quanto os extras exclusivos dela
 * (`ExtrasEmpresaSection`), pra não ter dois seletores de empresa/data
 * desencontrados na mesma tela.
 */
export function CardapioPorEmpresaTab({
  empresas,
  atualizarKey,
}: {
  empresas: EmpresaOption[]
  atualizarKey: number
}) {
  const [empresaId, setEmpresaId] = useState(empresas[0]?.id ?? '')
  const [from, setFrom] = useState(inicioDaSemana)
  const [to, setTo] = useState(() => somarDiasISO(inicioDaSemana(), 5))

  const empresa = empresas.find((e) => e.id === empresaId)

  if (empresas.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Cadastre uma empresa pra ver como o cardápio aparece pra ela.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Empresa</Label>
          <Select value={empresaId} onValueChange={setEmpresaId}>
            <SelectTrigger className="h-9 w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {empresas.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">De</Label>
          <Input
            type="date"
            className="h-9 w-36"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Até</Label>
          <Input
            type="date"
            className="h-9 w-36"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
      </div>

      {empresa && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px] lg:items-start">
          <CardapioTabela
            empresaNome={empresa.nome}
            cardapioQtdAlternativas={empresa.cardapioQtdAlternativas}
            from={from}
            to={to}
            atualizarKey={atualizarKey}
          />
          <ExtrasEmpresaSection
            empresaId={empresa.id}
            empresaNome={empresa.nome}
            from={from}
            to={to}
          />
        </div>
      )}
    </div>
  )
}
