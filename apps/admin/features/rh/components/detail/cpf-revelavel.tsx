'use client'

import { useState } from 'react'
import { Eye } from 'lucide-react'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'

import { Button } from '@repo/ui/components/button'

import { formatarCpf, mascararCpf } from '@/lib/cpf'
import { revelarCpfAction } from '../../lib/actions'

/**
 * O CPF completo não vem no HTML da página — só os últimos dígitos. Ver o
 * número inteiro é uma ação deliberada, e fica registrada em `audit_log`.
 */
export function CpfRevelavel({
  funcionarioId,
  cpfFinal,
}: {
  funcionarioId: string
  cpfFinal: string | null
}) {
  const [revelado, setRevelado] = useState<string | null>(null)

  const revelar = useAction(revelarCpfAction, {
    onSuccess: ({ data }) => {
      if (data?.cpf) setRevelado(formatarCpf(data.cpf))
    },
    onError: ({ error }) =>
      toast.error(error.serverError ?? 'Não foi possível revelar o CPF'),
  })

  if (!cpfFinal) {
    return <span className="text-sm text-muted-foreground">Não cadastrado</span>
  }

  if (revelado) {
    return <span className="text-sm tabular-nums">{revelado}</span>
  }

  return (
    <span className="flex items-center gap-1">
      <span className="text-sm tabular-nums">{mascararCpf(cpfFinal)}</span>
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        aria-label="Revelar CPF completo"
        disabled={revelar.isExecuting}
        onClick={() => revelar.execute({ id: funcionarioId })}
      >
        <Eye className="size-3.5" />
      </Button>
    </span>
  )
}
