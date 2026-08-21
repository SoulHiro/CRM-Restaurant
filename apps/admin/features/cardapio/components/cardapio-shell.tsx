'use client'

import { useState } from 'react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select'

import { CardapioTabela } from './cardapio-tabela'
import { CatalogoSection } from './catalogo-section'
import { GerarCardapioDrawer } from './gerar-cardapio-drawer'

export function CardapioShell({
  empresas,
}: {
  empresas: { id: string; nome: string }[]
}) {
  const [empresaId, setEmpresaId] = useState(empresas[0]?.id ?? '')
  const [atualizarKey, setAtualizarKey] = useState(0)

  if (empresas.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Cadastre uma empresa antes de montar o cardápio dela.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Select value={empresaId} onValueChange={setEmpresaId}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {empresas.map((empresa) => (
              <SelectItem key={empresa.id} value={empresa.id}>
                {empresa.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <GerarCardapioDrawer
          empresaId={empresaId}
          onConfirmado={() => setAtualizarKey((k) => k + 1)}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr] lg:items-start">
        <CatalogoSection empresaId={empresaId} key={`catalogo-${empresaId}`} />
        <CardapioTabela empresaId={empresaId} atualizarKey={atualizarKey} />
      </div>
    </div>
  )
}
