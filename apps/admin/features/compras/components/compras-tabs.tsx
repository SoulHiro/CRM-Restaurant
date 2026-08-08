import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@repo/ui/components/tabs'

import type { EstoqueItem } from '@/features/estoque/lib/types'
import type { CompraFiltro } from '../lib/compra-helpers'
import type {
  CompraNaLista,
  FornecedorListItem,
  SugestaoGrupo,
} from '../lib/types'
import { ComprasTab } from './compras/compras-tab'
import { FornecedoresTab } from './fornecedores/fornecedores-tab'
import { SugestaoTab } from './sugestao/sugestao-tab'

export function ComprasTabs({
  compras,
  sugestao,
  fornecedores,
  itens,
  precosPorFornecedor,
  filtro,
  hoje,
}: {
  compras: CompraNaLista[]
  sugestao: SugestaoGrupo[]
  fornecedores: FornecedorListItem[]
  itens: EstoqueItem[]
  precosPorFornecedor: Record<string, number>
  filtro: CompraFiltro
  hoje: string
}) {
  const atrasadas = compras.filter((compra) => compra.entregaAtrasada).length
  const itensSugeridos = sugestao.reduce(
    (soma, grupo) => soma + grupo.itens.length,
    0
  )

  return (
    <Tabs defaultValue={itensSugeridos > 0 ? 'sugestao' : 'compras'}>
      <TabsList className="flex w-full justify-start bg-sidebar">
        <TabsTrigger value="sugestao">
          Sugestão
          {itensSugeridos > 0 && (
            <span className="ml-1.5 rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
              {itensSugeridos}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="compras">
          Compras
          {atrasadas > 0 && (
            <span className="ml-1.5 rounded-full bg-destructive px-1.5 text-xs font-semibold text-destructive-foreground">
              {atrasadas}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="fornecedores">
          Fornecedores
          {fornecedores.length > 0 && (
            <span className="ml-1.5 text-xs opacity-70">
              {fornecedores.length}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="sugestao" className="mt-6">
        <SugestaoTab
          grupos={sugestao}
          fornecedores={fornecedores}
          itens={itens}
          precosPorFornecedor={precosPorFornecedor}
          hoje={hoje}
        />
      </TabsContent>

      <TabsContent value="compras" className="mt-6">
        <ComprasTab
          compras={compras}
          fornecedores={fornecedores}
          itens={itens}
          precosPorFornecedor={precosPorFornecedor}
          filtro={filtro}
          hoje={hoje}
        />
      </TabsContent>

      <TabsContent value="fornecedores" className="mt-6">
        <FornecedoresTab fornecedores={fornecedores} />
      </TabsContent>
    </Tabs>
  )
}
