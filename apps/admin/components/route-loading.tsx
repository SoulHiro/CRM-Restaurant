import { Skeleton } from '@repo/ui/components/skeleton'

/**
 * Skeleton genérico usado como `loading.tsx` de cada seção do dashboard.
 * Não precisa imitar o layout exato da página — o que importa é dar ao
 * Next.js um boundary de streaming pra prefetchar até aqui (rota dinâmica
 * sem `loading.tsx` não prefetcha nada) e mostrar algo imediatamente em vez
 * de travar a tela até a página inteira carregar.
 */
export function RouteLoading() {
  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    </div>
  )
}
