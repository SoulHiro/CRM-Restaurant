'use client'

import { useState } from 'react'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'

import { Button } from '@repo/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card'
import { Input } from '@repo/ui/components/input'
import { Label } from '@repo/ui/components/label'

import { salvarConfiguracaoResumoDiaAction } from '../lib/actions'
import type { ConfiguracaoResumoDia } from '../lib/types'

export function DadosEmpresaForm({
  configuracaoInicial,
}: {
  configuracaoInicial: ConfiguracaoResumoDia
}) {
  const [logoUrl, setLogoUrl] = useState(configuracaoInicial.logoUrl)
  const [corMarca, setCorMarca] = useState(
    configuracaoInicial.corMarca || '#000000'
  )

  const { execute, isExecuting } = useAction(salvarConfiguracaoResumoDiaAction, {
    onSuccess: () => toast.success('Dados da empresa salvos'),
    onError: () => toast.error('Não foi possível salvar'),
  })

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        Nome, endereço, CNPJ e Inscrição Estadual são fixos e ficam
        configurados direto no ambiente do sistema (não mudam no dia a dia).
        Aqui você só edita o que pode mudar com alguma frequência: logo e cor
        de marca.
      </p>

      <Card className="border-0">
        <CardHeader>
          <CardTitle className="text-base">Marca</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">URL do logo</Label>
            <Input
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://..."
            />
            <p className="text-xs text-muted-foreground">
              Cole o link de uma imagem já hospedada em algum lugar — upload
              direto ainda não está disponível.
            </p>
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt="Logo do restaurante"
                className="h-16 w-auto rounded-md border object-contain p-1"
              />
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Cor de marca</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={/^#[0-9a-fA-F]{6}$/.test(corMarca) ? corMarca : '#000000'}
                onChange={(e) => setCorMarca(e.target.value)}
                className="size-9 shrink-0 cursor-pointer rounded-md border"
                aria-label="Escolher cor de marca"
              />
              <Input
                value={corMarca}
                onChange={(e) => setCorMarca(e.target.value)}
                placeholder="#000000"
                className="max-w-32"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        className="self-start"
        disabled={isExecuting}
        onClick={() => execute({ logoUrl, corMarca })}
      >
        {isExecuting ? 'Salvando...' : 'Salvar dados da empresa'}
      </Button>
    </div>
  )
}
