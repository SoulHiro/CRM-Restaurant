import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@repo/ui/components/tabs'

import type { EmpresaDetail, EmpresaListItem } from '../../lib/types'
import { ContratoTab } from './tabs/contrato-tab'
import { DadosTab } from './tabs/dados-tab'
import { FinanceiroTab } from './tabs/financeiro-tab'
import { FuncionariosTab } from './tabs/funcionarios-tab'
import { OverviewTab } from './tabs/overview/overview-tab'
import { PausasTab } from './tabs/pausas-tab'
import { PedidosTab } from './tabs/pedidos-tab'

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
        <TabsTrigger value="contrato">Contrato</TabsTrigger>
        <TabsTrigger value="pausas">Pausas</TabsTrigger>
        <TabsTrigger value="pedidos">Pedidos</TabsTrigger>
        <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
        <TabsTrigger value="dados">Dados</TabsTrigger>
      </TabsList>

      <TabsContent value="visao-geral" className="mt-6">
        <OverviewTab detail={detail} />
      </TabsContent>
      <TabsContent value="funcionarios" className="mt-6">
        <FuncionariosTab funcionarios={detail.funcionarios} />
      </TabsContent>
      <TabsContent value="contrato" className="mt-6">
        <ContratoTab contrato={detail.contrato} />
      </TabsContent>
      <TabsContent value="pausas" className="mt-6">
        <PausasTab pausas={detail.pausas} />
      </TabsContent>
      <TabsContent value="pedidos" className="mt-6">
        <PedidosTab envios={detail.envios} />
      </TabsContent>
      <TabsContent value="financeiro" className="mt-6">
        <FinanceiroTab
          faturamentoMensal={detail.faturamentoMensal}
          contrato={detail.contrato}
        />
      </TabsContent>
      <TabsContent value="dados" className="mt-6">
        <DadosTab empresa={empresa} endereco={detail.endereco} />
      </TabsContent>
    </Tabs>
  )
}
