import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@repo/ui/components/tabs'

import { CargosTab } from './cargos/cargos-tab'
import { FolhaTab } from './folha/folha-tab'
import { FuncionariosTab } from './list/funcionarios-tab'
import type {
  Cargo,
  FolhaFechada,
  FolhaPrevia,
  FuncionarioListItem,
  TurnoTrabalho,
} from '../lib/types'

export function RhTabs({
  funcionarios,
  cargos,
  competencia,
  previa,
  fechada,
  historico,
  filtros,
  hoje,
}: {
  funcionarios: FuncionarioListItem[]
  cargos: Cargo[]
  competencia: string
  previa: FolhaPrevia
  fechada: FolhaFechada | null
  historico: { id: string; competencia: string; total: number }[]
  filtros: {
    busca: string
    cargoId: string
    status: 'ativo' | 'desligado' | 'todos'
    turno: TurnoTrabalho | 'todos'
  }
  hoje: string
}) {
  const ativos = funcionarios.filter((f) => f.status === 'ativo').length

  return (
    <Tabs defaultValue="equipe">
      <TabsList className="flex w-full justify-start bg-sidebar">
        <TabsTrigger value="equipe">
          Equipe
          {ativos > 0 && (
            <span className="ml-1.5 text-xs opacity-70">{ativos}</span>
          )}
        </TabsTrigger>
        <TabsTrigger value="folha">
          Folha
          {!fechada && previa.linhas.length > 0 && (
            <span className="ml-1.5 rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
              {previa.linhas.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="cargos">
          Cargos
          {cargos.length > 0 && (
            <span className="ml-1.5 text-xs opacity-70">{cargos.length}</span>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="equipe" className="mt-6">
        <FuncionariosTab
          funcionarios={funcionarios}
          cargos={cargos}
          filtros={filtros}
          hoje={hoje}
        />
      </TabsContent>

      <TabsContent value="folha" className="mt-6">
        <FolhaTab
          competencia={competencia}
          previa={previa}
          fechada={fechada}
          historico={historico}
        />
      </TabsContent>

      <TabsContent value="cargos" className="mt-6">
        <CargosTab cargos={cargos} />
      </TabsContent>
    </Tabs>
  )
}
