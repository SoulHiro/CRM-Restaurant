import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@repo/ui/components/tabs'

import type { EstoqueItemDetalhe } from '../../lib/types'
import { DadosTab } from './tabs/dados-tab'
import { MovimentosTab } from './tabs/movimentos-tab'
import { PerdasTab } from './tabs/perdas-tab'
import { PrecosTab } from './tabs/precos-tab'

export function ItemTabs({ detalhe }: { detalhe: EstoqueItemDetalhe }) {
  const { item, movimentos, perdas, precos } = detalhe

  return (
    <Tabs defaultValue="movimentos">
      <TabsList className="flex w-full justify-start bg-sidebar">
        <TabsTrigger value="movimentos">
          Movimentações
          {movimentos.length > 0 && (
            <span className="ml-1.5 text-xs opacity-70">
              {movimentos.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="perdas">
          Perdas
          {perdas.length > 0 && (
            <span className="ml-1.5 text-xs opacity-70">{perdas.length}</span>
          )}
        </TabsTrigger>
        <TabsTrigger value="precos">
          Preços
          {precos.length > 0 && (
            <span className="ml-1.5 text-xs opacity-70">{precos.length}</span>
          )}
        </TabsTrigger>
        <TabsTrigger value="dados">Dados</TabsTrigger>
      </TabsList>

      <TabsContent value="movimentos" className="mt-6">
        <MovimentosTab movimentos={movimentos} unidade={item.unidade} />
      </TabsContent>
      <TabsContent value="perdas" className="mt-6">
        <PerdasTab perdas={perdas} unidade={item.unidade} />
      </TabsContent>
      <TabsContent value="precos" className="mt-6">
        <PrecosTab precos={precos} unidade={item.unidade} />
      </TabsContent>
      <TabsContent value="dados" className="mt-6">
        <DadosTab item={item} />
      </TabsContent>
    </Tabs>
  )
}
