import { EmpresasTable } from '@/features/empresas/components/list/empresas-table'
import { EmpresasToolbar } from '@/features/empresas/components/list/empresas-toolbar'
import { getEmpresas } from '@/features/empresas/lib/queries'

export default async function EmpresasPage() {
  const empresas = await getEmpresas()

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Empresas</h1>
        <p className="text-sm text-muted-foreground">
          Empresas clientes cadastradas e o andamento dos pedidos da semana.
        </p>
      </div>

      <EmpresasToolbar />

      <EmpresasTable empresas={empresas} />
    </div>
  )
}
