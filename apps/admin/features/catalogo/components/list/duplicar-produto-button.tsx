'use client'

import { useRouter } from 'next/navigation'
import { useAction } from 'next-safe-action/hooks'
import { Copy } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@repo/ui/components/button'

import { duplicarProdutoAction } from '../../lib/actions'

/**
 * Fica fora do `<Link>` da linha (não dentro) — botão dentro de âncora é
 * inválido e complica foco/teclado. `stopPropagation` evita que o clique
 * borbulhe pra qualquer handler futuro na linha.
 */
export function DuplicarProdutoButton({ produtoId }: { produtoId: string }) {
  const router = useRouter()

  const { execute, isExecuting } = useAction(duplicarProdutoAction, {
    onSuccess: ({ data }) => {
      if (!data) return
      toast.success('Produto duplicado — pausado hoje até você revisar')
      router.push(`/catalogo/produtos/${data.produtoId}/editar`)
    },
    onError: () => toast.error('Não foi possível duplicar o produto'),
  })

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="mr-2 shrink-0"
      aria-label="Duplicar produto"
      title="Duplicar produto"
      disabled={isExecuting}
      onClick={(e) => {
        e.stopPropagation()
        execute({ produtoId })
      }}
    >
      <Copy className="size-4" />
    </Button>
  )
}
