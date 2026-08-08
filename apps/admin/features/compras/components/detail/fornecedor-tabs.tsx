import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@repo/ui/components/tabs'

import type { EstoqueItem } from '@/features/estoque/lib/types'
import type { FornecedorDetalhe } from '../../lib/types'
import { AvaliacoesTab } from './tabs/avaliacoes-tab'
import { ComprasFornecedorTab } from './tabs/compras-fornecedor-tab'
import { ItensTab } from './tabs/itens-tab'

export function FornecedorTabs({
  fornecedor,
  itens,
}: {
  fornecedor: FornecedorDetalhe
  itens: EstoqueItem[]
}) {
  return (
    <Tabs defaultValue="itens">
      <TabsList className="flex w-full justify-start bg-sidebar">
        <TabsTrigger value="itens">
          Itens e preços
          {fornecedor.itens.length > 0 && (
            <span className="ml-1.5 text-xs opacity-70">
              {fornecedor.itens.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="compras">
          Compras
          {fornecedor.compras.length > 0 && (
            <span className="ml-1.5 text-xs opacity-70">
              {fornecedor.compras.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="avaliacoes">
          Avaliações
          {fornecedor.avaliacoes.length > 0 && (
            <span className="ml-1.5 text-xs opacity-70">
              {fornecedor.avaliacoes.length}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="itens" className="mt-6">
        <ItensTab
          fornecedorId={fornecedor.id}
          ofertas={fornecedor.itens}
          itens={itens}
        />
      </TabsContent>

      <TabsContent value="compras" className="mt-6">
        <ComprasFornecedorTab compras={fornecedor.compras} />
      </TabsContent>

      <TabsContent value="avaliacoes" className="mt-6">
        <AvaliacoesTab avaliacoes={fornecedor.avaliacoes} />
      </TabsContent>
    </Tabs>
  )
}
