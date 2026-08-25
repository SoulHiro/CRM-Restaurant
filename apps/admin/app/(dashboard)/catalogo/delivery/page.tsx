import { EmptyState } from '@repo/ui/components/empty-state'

export default function DeliveryPage() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div>
        <h1 className="text-xl font-semibold">Cardápio de delivery</h1>
        <p className="text-sm text-muted-foreground">
          Vitrine do cliente pra delivery — ainda não existe.
        </p>
      </div>

      <EmptyState message="Em breve." />
    </div>
  )
}
