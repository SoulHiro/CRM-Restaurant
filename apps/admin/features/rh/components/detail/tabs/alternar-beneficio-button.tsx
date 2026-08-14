'use client'

import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'

import { Button } from '@repo/ui/components/button'

import { alternarBeneficioAction } from '../../../lib/actions'
import type { Beneficio } from '../../../lib/types'

export function AlternarBeneficioButton({
  beneficio,
}: {
  beneficio: Beneficio
}) {
  const alternar = useAction(alternarBeneficioAction, {
    onSuccess: ({ data }) =>
      toast.success(data?.ativo ? 'Benefício ativado' : 'Benefício desativado'),
    onError: ({ error }) =>
      toast.error(error.serverError ?? 'Não foi possível alterar'),
  })

  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full sm:w-auto"
      disabled={alternar.isExecuting}
      onClick={() => alternar.execute({ id: beneficio.id })}
    >
      {beneficio.ativo ? 'Desativar' : 'Ativar'}
    </Button>
  )
}
