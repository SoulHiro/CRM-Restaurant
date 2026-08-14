import { EntregadoresLista } from '@/features/rh/components/entregadores/entregadores-lista'
import { getEntregadores } from '@/features/rh/lib/queries'
import { hojeISO } from '@/lib/formatters'

export default async function EntregadoresPage() {
  const entregadores = await getEntregadores()

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold">Entregadores</h1>
        <p className="text-sm text-muted-foreground">
          Quem recebe por diária. A ficha completa fica em Funcionários — aqui é
          o recorte de quem entrega.
        </p>
      </div>

      <EntregadoresLista entregadores={entregadores} hoje={hojeISO()} />
    </div>
  )
}
