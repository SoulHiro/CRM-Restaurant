import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@repo/ui/components/tabs'

import type { EmpresaDetail, EmpresaListItem } from '../../lib/types'
import { DadosTab } from './tabs/dados-tab'
import { FaturamentoTab } from './tabs/faturamento-tab'
import { FuncionariosTab } from './tabs/funcionarios/funcionarios-tab'
import { HistoricoTab } from './tabs/historico/historico-tab'
import { OverviewTab } from './tabs/overview/overview-tab'
import { PausasTab } from './tabs/pausas/pausas-tab'
import { PedidosTab } from './tabs/pedidos/pedidos-tab'
import { ValoresTab } from './tabs/valores/valores-tab'

export function EmpresaTabs({
  empresa,
  detail,
}: {
  empresa: EmpresaListItem
  detail: EmpresaDetail
}) {
  return (
    <Tabs defaultValue="visao-geral">
      <TabsList className="flex w-full justify-start bg-sidebar">
        <TabsTrigger value="visao-geral">Visão geral</TabsTrigger>
        <TabsTrigger value="funcionarios">Funcionários</TabsTrigger>
        <TabsTrigger value="pedidos">Pedidos</TabsTrigger>
        <TabsTrigger value="valores">Valores</TabsTrigger>
        <TabsTrigger value="historico">Histórico</TabsTrigger>
        <TabsTrigger value="pausas">Pausas</TabsTrigger>
        <TabsTrigger value="faturamento">Faturamento</TabsTrigger>
        <TabsTrigger value="dados">Dados</TabsTrigger>
      </TabsList>

      <TabsContent value="visao-geral" className="mt-6">
        <OverviewTab detail={detail} />
      </TabsContent>
      <TabsContent value="funcionarios" className="mt-6">
        <FuncionariosTab empresaId={empresa.id} />
      </TabsContent>
      <TabsContent value="pedidos" className="mt-6">
        <PedidosTab empresaId={empresa.id} empresaNome={empresa.nome} />
      </TabsContent>
      <TabsContent value="valores" className="mt-6">
        <ValoresTab empresaId={empresa.id} />
      </TabsContent>
      <TabsContent value="historico" className="mt-6">
        <HistoricoTab
          empresaId={empresa.id}
          empresaNome={empresa.nome}
          funcionarios={detail.funcionarios}
        />
      </TabsContent>
      <TabsContent value="pausas" className="mt-6">
        <PausasTab empresaId={empresa.id} pausas={detail.pausas} />
      </TabsContent>
      <TabsContent value="faturamento" className="mt-6">
        <FaturamentoTab empresaId={empresa.id} contrato={detail.contrato} />
      </TabsContent>
      <TabsContent value="dados" className="mt-6">
        <DadosTab
          empresa={empresa}
          endereco={empresa.endereco}
          documentos={detail.documentos}
        />
      </TabsContent>
    </Tabs>
  )
}
