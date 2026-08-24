import { CardapioShell } from '@/features/cardapio/components/cardapio-shell'
import { getEmpresas } from '@/features/empresas/lib/queries'

export default async function CardapioPage() {
  const empresas = await getEmpresas()

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Cardápio</h1>
        <p className="text-sm text-muted-foreground">
          Catálogo de pratos e geração do cardápio semanal/mensal por
          empresa-cliente.
        </p>
      </div>

      <CardapioShell
        empresas={empresas.map((e) => ({
          id: e.id,
          nome: e.nome,
          cardapioQtdAlternativas: e.cardapioQtdAlternativas,
        }))}
      />
    </div>
  )
}
