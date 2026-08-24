'use client'

import { useState } from 'react'

import { CardapioTabela } from './cardapio-tabela'
import { CatalogoSection } from './catalogo-section'
import { GerarCardapioDrawer } from './gerar-cardapio-drawer'

export function CardapioShell({
  empresas,
}: {
  empresas: { id: string; nome: string; cardapioQtdAlternativas: number }[]
}) {
  const [atualizarKey, setAtualizarKey] = useState(0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Um cardápio só pro restaurante inteiro — prato do dia e alternativas
          são os mesmos pra todas as empresas.
        </p>
        <GerarCardapioDrawer
          onConfirmado={() => setAtualizarKey((k) => k + 1)}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr] lg:items-start">
        <CatalogoSection />
        {empresas.length > 0 ? (
          <CardapioTabela empresas={empresas} atualizarKey={atualizarKey} />
        ) : (
          <p className="text-sm text-muted-foreground">
            Cadastre uma empresa pra ver como o cardápio aparece pra ela.
          </p>
        )}
      </div>
    </div>
  )
}
