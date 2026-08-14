import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@repo/ui/components/tabs'

import type { FuncionarioDetalhe } from '../../lib/types'
import { AusenciasTab } from './tabs/ausencias-tab'
import { BeneficiosTab } from './tabs/beneficios-tab'
import { DadosTab } from './tabs/dados-tab'
import { SalariosTab } from './tabs/salarios-tab'

export function FuncionarioTabs({
  funcionario,
  hoje,
}: {
  funcionario: FuncionarioDetalhe
  hoje: string
}) {
  return (
    <Tabs defaultValue="dados">
      <TabsList className="flex w-full justify-start bg-sidebar">
        <TabsTrigger value="dados">Dados</TabsTrigger>
        <TabsTrigger value="salarios">
          Salários
          {funcionario.salarios.length > 0 && (
            <span className="ml-1.5 text-xs opacity-70">
              {funcionario.salarios.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="ausencias">
          Ausências
          {funcionario.ausencias.length > 0 && (
            <span className="ml-1.5 text-xs opacity-70">
              {funcionario.ausencias.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="beneficios">
          Benefícios
          {funcionario.beneficios.length > 0 && (
            <span className="ml-1.5 text-xs opacity-70">
              {funcionario.beneficios.length}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="dados" className="mt-6">
        <DadosTab funcionario={funcionario} hoje={hoje} />
      </TabsContent>

      <TabsContent value="salarios" className="mt-6">
        <SalariosTab salarios={funcionario.salarios} />
      </TabsContent>

      <TabsContent value="ausencias" className="mt-6">
        <AusenciasTab
          funcionarioId={funcionario.id}
          funcionarioNome={funcionario.nome}
          ausencias={funcionario.ausencias}
          hoje={hoje}
        />
      </TabsContent>

      <TabsContent value="beneficios" className="mt-6">
        <BeneficiosTab
          funcionarioId={funcionario.id}
          beneficios={funcionario.beneficios}
        />
      </TabsContent>
    </Tabs>
  )
}
