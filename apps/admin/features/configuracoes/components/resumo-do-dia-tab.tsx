'use client'

import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'

import { Button } from '@repo/ui/components/button'
import { Input } from '@repo/ui/components/input'
import { Label } from '@repo/ui/components/label'

import { salvarConfiguracaoResumoDiaAction } from '../lib/actions'

export function ResumoDoDiaTab({
  cnpj,
  setCnpj,
  nomeEstabelecimento,
  setNomeEstabelecimento,
}: {
  cnpj: string
  setCnpj: (v: string) => void
  nomeEstabelecimento: string
  setNomeEstabelecimento: (v: string) => void
}) {
  const { execute, isExecuting } = useAction(salvarConfiguracaoResumoDiaAction, {
    onSuccess: () => toast.success('Configuração salva'),
    onError: () => toast.error('Não foi possível salvar'),
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-lg bg-card p-4">
        <p className="text-sm text-muted-foreground">
          Aparece no cabeçalho da nota de fechamento do dia, impressa pela aba
          Pedidos de cada empresa. Café/suco/lanche são lançados na hora, no
          próprio &quot;Finalizar dia&quot;.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Nome do estabelecimento</Label>
            <Input
              value={nomeEstabelecimento}
              onChange={(e) => setNomeEstabelecimento(e.target.value)}
              placeholder="Ex: Restaurante Nosso Quintal"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">CNPJ</Label>
            <Input
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
              placeholder="00.000.000/0000-00"
            />
          </div>
        </div>

        <Button
          className="self-start"
          disabled={isExecuting}
          onClick={() => execute({ cnpj, nomeEstabelecimento })}
        >
          {isExecuting ? 'Salvando...' : 'Salvar configuração'}
        </Button>
      </div>
    </div>
  )
}
