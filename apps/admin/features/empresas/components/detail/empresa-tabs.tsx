import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@repo/ui/components/tabs'

import type {
  EmpresaDetail,
  EmpresaListItem,
  VisaoGeralOperacional,
} from '../../lib/types'
import { ConfiguracoesTab } from './tabs/configuracoes-tab'
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
  operacional,
  role,
}: {
  empresa: EmpresaListItem
  detail: EmpresaDetail
  operacional: VisaoGeralOperacional
  role?: string
}) {
  // Caixa só acompanha operação (visão geral, funcionários, pedidos,
  // histórico, pausas, dados) — sem acesso a valores/faturamento nem às
  // configurações operacionais da empresa.
  const vePrecos = role !== 'caixa'

  return (
    <Tabs defaultValue="visao-geral">
      <TabsList className="flex w-full justify-start bg-sidebar">
        <TabsTrigger value="visao-geral" className="flex-1">Visão geral</TabsTrigger>
        <TabsTrigger value="funcionarios" className="flex-1">Funcionários</TabsTrigger>
        <TabsTrigger value="pedidos" className="flex-1">Pedidos</TabsTrigger>
        {vePrecos && <TabsTrigger value="valores" className="flex-1">Valores</TabsTrigger>}
        <TabsTrigger value="historico" className="flex-1">Histórico</TabsTrigger>
        <TabsTrigger value="pausas" className="flex-1">Pausas</TabsTrigger>
        {vePrecos && <TabsTrigger value="faturamento" className="flex-1">Faturamento</TabsTrigger>}
        <TabsTrigger value="dados" className="flex-1">Dados</TabsTrigger>
        {vePrecos && (
          <TabsTrigger value="configuracoes" className="flex-1">Configurações</TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="visao-geral" className="mt-6">
        <OverviewTab
          detail={detail}
          operacional={operacional}
          mostraFaturamento={vePrecos}
        />
      </TabsContent>
      <TabsContent value="funcionarios" className="mt-6">
        <FuncionariosTab
          empresaId={empresa.id}
          fluxoPedido={empresa.fluxoPedido}
        />
      </TabsContent>
      <TabsContent value="pedidos" className="mt-6">
        <PedidosTab
          empresaId={empresa.id}
          empresaNome={empresa.nome}
          empresaEndereco={empresa.endereco}
          fluxoPedido={empresa.fluxoPedido}
          resumoMostraQuantidades={empresa.resumoMostraQuantidades}
          precoModo={empresa.precoModo}
          pedeCafe={empresa.pedeCafe}
          pedeLanche={empresa.pedeLanche}
          pedeSuco={empresa.pedeSuco}
        />
      </TabsContent>
      {vePrecos && (
        <TabsContent value="valores" className="mt-6">
          <ValoresTab
            empresaId={empresa.id}
            precoModo={empresa.precoModo}
            pedeCafe={empresa.pedeCafe}
            pedeLanche={empresa.pedeLanche}
            pedeSuco={empresa.pedeSuco}
          />
        </TabsContent>
      )}
      <TabsContent value="historico" className="mt-6">
        <HistoricoTab
          empresaId={empresa.id}
          empresaNome={empresa.nome}
          funcionarios={detail.funcionarios}
          resumoMostraQuantidades={empresa.resumoMostraQuantidades}
          precoModo={empresa.precoModo}
          pedeCafe={empresa.pedeCafe}
          pedeLanche={empresa.pedeLanche}
          pedeSuco={empresa.pedeSuco}
        />
      </TabsContent>
      <TabsContent value="pausas" className="mt-6">
        <PausasTab empresaId={empresa.id} pausas={detail.pausas} />
      </TabsContent>
      {vePrecos && (
        <TabsContent value="faturamento" className="mt-6">
          <FaturamentoTab empresaId={empresa.id} contrato={detail.contrato} />
        </TabsContent>
      )}
      <TabsContent value="dados" className="mt-6">
        <DadosTab
          empresa={empresa}
          endereco={empresa.endereco}
          documentos={detail.documentos}
        />
      </TabsContent>
      {vePrecos && (
        <TabsContent value="configuracoes" className="mt-6">
          <ConfiguracoesTab empresa={empresa} />
        </TabsContent>
      )}
    </Tabs>
  )
}
