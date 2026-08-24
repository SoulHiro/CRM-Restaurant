'use client'

import { useRouter } from 'next/navigation'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'

import { Button } from '@repo/ui/components/button'

import { iniciarInventarioAction } from '../../lib/actions'
import type { InventarioTipo } from '../../lib/types'

export function IniciarContagemButton({
  tipo,
  label,
  disabled,
}: {
  tipo: InventarioTipo
  label: string
  disabled?: boolean
}) {
  const router = useRouter()

  const { execute, isExecuting } = useAction(iniciarInventarioAction, {
    onSuccess: ({ data }) => {
      if (data?.inventarioId) {
        router.push(`/estoque/inventario/${data.inventarioId}`)
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? 'Não foi possível abrir a contagem')
    },
  })

  return (
    <Button
      size="lg"
      className="h-16 w-full text-base font-semibold"
      disabled={disabled || isExecuting}
      onClick={() => execute({ tipo })}
    >
      {isExecuting ? 'Abrindo...' : label}
    </Button>
  )
}
