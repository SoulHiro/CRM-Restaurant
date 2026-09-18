import { ConsumoFuncionarioPage } from '@/features/consumo-funcionario/components/consumo-funcionario-page'
import {
  getCategoriasProduto,
  getFuncionariosComConsumo,
  getProdutosConsumiveis,
} from '@/features/consumo-funcionario/lib/queries'
import { getActiveOrganizationId } from '@/lib/get-active-organization-id'

export default async function CaixaPage() {
  const organizationId = await getActiveOrganizationId()
  const [funcionarios, produtos, categorias] = await Promise.all([
    getFuncionariosComConsumo(),
    organizationId ? getProdutosConsumiveis(organizationId) : [],
    organizationId ? getCategoriasProduto(organizationId) : [],
  ])

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold">Caixa</h1>
        <p className="text-sm text-muted-foreground">
          Consumo interno — doce, bebida ou sobremesa que um funcionário pega
          pra si, vinculado ao nome dele.
        </p>
      </div>

      <ConsumoFuncionarioPage
        funcionariosIniciais={funcionarios}
        produtos={produtos}
        categorias={categorias}
      />
    </div>
  )
}
