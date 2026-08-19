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
  const [nomeEstabelecimento, setNomeEstabelecimento] = useState(
    configuracaoInicial.nomeEstabelecimento
  )
  const [endereco, setEndereco] = useState(configuracaoInicial.endereco)
  const [cnpj, setCnpj] = useState(configuracaoInicial.cnpj)
  const [inscricaoEstadual, setInscricaoEstadual] = useState(
    configuracaoInicial.inscricaoEstadual
  )
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
      <Card className="border-0">
        <CardHeader>
          <CardTitle className="text-base">Cadastro</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Esses dados aparecem no cabeçalho da nota de fechamento do dia
            (impressa pela aba Pedidos de cada empresa) e em outros lugares do
            sistema que precisem identificar o restaurante.
          </p>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Nome do estabelecimento</Label>
            <Input
              value={nomeEstabelecimento}
              onChange={(e) => setNomeEstabelecimento(e.target.value)}
              placeholder="Ex: Restaurante Nosso Quintal"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Endereço</Label>
            <Input
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              placeholder="Rua, número, bairro, cidade/UF"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">CNPJ</Label>
              <Input
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                placeholder="00.000.000/0000-00"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Inscrição Estadual</Label>
              <Input
                value={inscricaoEstadual}
                onChange={(e) => setInscricaoEstadual(e.target.value)}
                placeholder="000.000.000.000"
              />
            </div>
          </div>
        </CardContent>
      </Card>

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
        onClick={() =>
          execute({
            nomeEstabelecimento,
            endereco,
            cnpj,
            inscricaoEstadual,
            logoUrl,
            corMarca,
          })
        }
      >
        {isExecuting ? 'Salvando...' : 'Salvar dados da empresa'}
      </Button>
    </div>
  )
}
