import { CriarGrupoDrawer } from '@/features/catalogo/components/adicionais/criar-grupo-drawer'
import { GruposList } from '@/features/catalogo/components/adicionais/grupos-list'
import { getGruposAdicionais } from '@/features/catalogo/lib/queries'

export default async function AdicionaisPage() {
  const grupos = await getGruposAdicionais()

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Adicionais</h1>
          <p className="text-sm text-muted-foreground">
            Grupos reutilizáveis de adicionais — um produto escolhe quais
            grupos ele aceita.
          </p>
        </div>
        <CriarGrupoDrawer />
      </div>

      <GruposList
        grupos={grupos}
        vazioMensagem="Nenhum grupo cadastrado ainda."
      />
    </div>
  )
}
