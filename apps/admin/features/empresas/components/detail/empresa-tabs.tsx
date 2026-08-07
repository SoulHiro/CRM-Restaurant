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
import { PedidosSemanaTab } from './tabs/pedidos-semana/pedidos-semana-tab'

export function EmpresaTabs({
  empresa,
  detail,
  searchParams,
}: {
  empresa: EmpresaListItem
  detail: EmpresaDetail
  searchParams: Record<string, string | string[] | undefined>
}) {
  return (
    <Tabs defaultValue="visao-geral">
      <TabsList className="flex w-full justify-start bg-sidebar">
        <TabsTrigger value="visao-geral">Visão geral</TabsTrigger>
        <TabsTrigger value="funcionarios">Funcionários</TabsTrigger>
        <TabsTrigger value="pedidos-semana">Pedidos da Semana</TabsTrigger>
        <TabsTrigger value="historico">Histórico</TabsTrigger>
        <TabsTrigger value="pausas">Pausas</TabsTrigger>
        <TabsTrigger value="faturamento">Faturamento</TabsTrigger>
        <TabsTrigger value="dados">Dados</TabsTrigger>
      </TabsList>

      <TabsContent value="visao-geral" className="mt-6">
        <OverviewTab detail={detail} />
      </TabsContent>
      <TabsContent value="funcionarios" className="mt-6">
        <FuncionariosTab
          empresaId={empresa.id}
          funcionarios={detail.funcionarios}
          searchParams={searchParams}
        />
      </TabsContent>
      <TabsContent value="pedidos-semana" className="mt-6">
        <PedidosSemanaTab
          empresaNome={empresa.nome}
          funcionarios={detail.funcionarios}
        />
      </TabsContent>
      <TabsContent value="historico" className="mt-6">
        <HistoricoTab funcionarios={detail.funcionarios} />
      </TabsContent>
      <TabsContent value="pausas" className="mt-6">
        <PausasTab empresaId={empresa.id} pausas={detail.pausas} />
      </TabsContent>
      <TabsContent value="faturamento" className="mt-6">
        <FaturamentoTab
          faturamentoMensal={detail.faturamentoMensal}
          contrato={detail.contrato}
        />
      </TabsContent>
      <TabsContent value="dados" className="mt-6">
        <DadosTab
          empresa={empresa}
          endereco={detail.endereco}
          documentos={detail.documentos}
        />
      </TabsContent>
    </Tabs>
  )
}
