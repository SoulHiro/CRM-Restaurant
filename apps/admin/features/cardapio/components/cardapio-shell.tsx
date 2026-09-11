'use client'

import { useState } from 'react'

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@repo/ui/components/tabs'

import { CardapioPorEmpresaTab } from './cardapio-por-empresa-tab'
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
          Prato do dia e alternativas são gerados uma vez pro restaurante
          inteiro — cada empresa pode ainda ter pratos exclusivos por cima,
          por causa de contrato específico.
        </p>
        <GerarCardapioDrawer
          onConfirmado={() => setAtualizarKey((k) => k + 1)}
        />
      </div>

      <Tabs defaultValue="por-empresa">
        <TabsList>
          <TabsTrigger value="por-empresa">Cardápio por empresa</TabsTrigger>
          <TabsTrigger value="catalogo">Catálogo de pratos</TabsTrigger>
        </TabsList>

        <TabsContent value="por-empresa" className="mt-4">
          <CardapioPorEmpresaTab
            empresas={empresas}
            atualizarKey={atualizarKey}
          />
        </TabsContent>

        <TabsContent value="catalogo" className="mt-4">
          <div className="max-w-lg">
            <CatalogoSection />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
