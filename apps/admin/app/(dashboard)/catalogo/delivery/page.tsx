import { ProdutosTable } from '@/features/catalogo/components/list/produtos-table'
import { getProdutosDelivery } from '@/features/catalogo/lib/queries'

export default async function DeliveryPage() {
  const produtos = await getProdutosDelivery()

  return (
    <div className="flex flex-col gap-4 p-6">
      <div>
        <h1 className="text-xl font-semibold">Cardápio de delivery</h1>
        <p className="text-sm text-muted-foreground">
          Prévia administrativa dos produtos disponíveis pra delivery — sem
          pedido, é só a lista que vai aparecer na vitrine quando ela existir.
        </p>
      </div>

      <ProdutosTable
        produtos={produtos}
        vazioMensagem="Nenhum produto disponível pra delivery ainda."
      />
    </div>
  )
}
