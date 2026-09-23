import { eq } from 'drizzle-orm'

import { ConsumoFuncionarioPage } from '@/features/consumo-funcionario/components/consumo-funcionario-page'
import {
  getCategoriasProduto,
  getFuncionariosComConsumo,
  getProdutosConsumiveis,
} from '@/features/consumo-funcionario/lib/queries'
import { MesasTab } from '@/features/mesas/components/caixa/mesas-tab'
import {
  getComandasAbertas,
  getNotasPendentesHoje,
} from '@/features/mesas/lib/queries'
import { db } from '@/lib/db'
import { getActiveOrganizationId } from '@/lib/get-active-organization-id'
import { organization } from '@repo/db'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@repo/ui/components/tabs'

export default async function CaixaPage() {
  const organizationId = await getActiveOrganizationId()
  const [funcionarios, produtos, categorias, comandas, notasPendentes, org] =
    await Promise.all([
      getFuncionariosComConsumo(),
      organizationId ? getProdutosConsumiveis(organizationId) : [],
      organizationId ? getCategoriasProduto(organizationId) : [],
      organizationId ? getComandasAbertas(organizationId) : [],
      organizationId ? getNotasPendentesHoje(organizationId) : [],
      organizationId
        ? db.query.organization.findFirst({
            where: eq(organization.id, organizationId),
            columns: { name: true },
          })
        : null,
    ])

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold">Caixa</h1>
        <p className="text-sm text-muted-foreground">
          Mesas do salão e consumo interno de funcionário.
        </p>
      </div>

      <Tabs defaultValue="mesas">
        <TabsList>
          <TabsTrigger value="mesas">Mesas</TabsTrigger>
          <TabsTrigger value="consumo">Consumo interno</TabsTrigger>
        </TabsList>

        <TabsContent value="mesas">
          {organizationId && (
            <MesasTab
              organizationId={organizationId}
              organizationName={org?.name ?? ''}
              comandasIniciais={comandas}
              notasPendentes={notasPendentes}
            />
          )}
        </TabsContent>

        <TabsContent value="consumo">
          <ConsumoFuncionarioPage
            funcionariosIniciais={funcionarios}
            produtos={produtos}
            categorias={categorias}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
