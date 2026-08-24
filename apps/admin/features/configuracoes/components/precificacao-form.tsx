'use client'

import { useState } from 'react'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'

import { Button } from '@repo/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card'
import { Input } from '@repo/ui/components/input'
import { Label } from '@repo/ui/components/label'
import { cn } from '@repo/ui/lib/utils'

import {
  COR_MARGEM_CLASSE,
  COR_MARGEM_LABEL,
} from '@/features/catalogo/lib/precificacao-helpers'
import { salvarConfiguracaoPrecificacaoAction } from '../lib/actions'
import type { ConfiguracaoPrecificacao } from '../lib/types'

function CampoNumero({
  label,
  value,
  onChange,
  sufixo,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  sufixo?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm">{label}</Label>
      <div className="relative">
        <Input
          type="number"
          min={0}
          step="0.01"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className={sufixo ? 'pr-10' : undefined}
        />
        {sufixo && (
          <span className="absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
            {sufixo}
          </span>
        )}
      </div>
    </div>
  )
}

export function PrecificacaoForm({
  configuracaoInicial,
}: {
  configuracaoInicial: ConfiguracaoPrecificacao
}) {
  const [config, setConfig] = useState(configuracaoInicial)

  const { execute, isExecuting } = useAction(
    salvarConfiguracaoPrecificacaoAction,
    {
      onSuccess: () => toast.success('Configuração de precificação salva'),
      onError: () =>
        toast.error(
          'Não foi possível salvar — confira se os limiares estão em ordem crescente'
        ),
    }
  )

  function set<K extends keyof ConfiguracaoPrecificacao>(
    campo: K,
    valor: number
  ) {
    setConfig((atual) => ({ ...atual, [campo]: valor }))
  }

  const tiers: { cor: keyof typeof COR_MARGEM_LABEL; faixa: string }[] = [
    { cor: 'vermelho', faixa: `até ${config.limiarAmareloPct}%` },
    {
      cor: 'amarelo',
      faixa: `${config.limiarAmareloPct}% – ${config.limiarVerdePct}%`,
    },
    {
      cor: 'verde',
      faixa: `${config.limiarVerdePct}% – ${config.limiarAzulPct}%`,
    },
    {
      cor: 'azul',
      faixa: `${config.limiarAzulPct}% – ${config.limiarRoxoPct}%`,
    },
    { cor: 'roxo', faixa: `acima de ${config.limiarRoxoPct}%` },
  ]

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        Esses números alimentam o cálculo de preço sugerido e a cor de margem no
        cadastro de produto do Catálogo.
      </p>

      <Card className="border-0">
        <CardHeader>
          <CardTitle className="text-base">Custo operacional</CardTitle>
          <CardDescription>
            Custo de gás, energia e produção por minuto de preparo — soma ao
            custo de insumos pra formar o custo de produção do prato.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CampoNumero
            label="Custo por minuto"
            value={config.custoOperacionalPorMinuto}
            onChange={(v) => set('custoOperacionalPorMinuto', v)}
            sufixo="R$/min"
          />
        </CardContent>
      </Card>

      <Card className="border-0">
        <CardHeader>
          <CardTitle className="text-base">Faixas de margem</CardTitle>
          <CardDescription>
            Percentual de lucro sobre o custo de produção que define a cor
            mostrada ao lado do preço de venda de cada produto.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CampoNumero
              label="Início do amarelo"
              value={config.limiarAmareloPct}
              onChange={(v) => set('limiarAmareloPct', v)}
              sufixo="%"
            />
            <CampoNumero
              label="Início do verde"
              value={config.limiarVerdePct}
              onChange={(v) => set('limiarVerdePct', v)}
              sufixo="%"
            />
            <CampoNumero
              label="Início do azul"
              value={config.limiarAzulPct}
              onChange={(v) => set('limiarAzulPct', v)}
              sufixo="%"
            />
            <CampoNumero
              label="Início do roxo"
              value={config.limiarRoxoPct}
              onChange={(v) => set('limiarRoxoPct', v)}
              sufixo="%"
            />
          </div>

          <div className="flex flex-col gap-1.5 rounded-md border p-3">
            {tiers.map(({ cor, faixa }) => (
              <div
                key={cor}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className={cn('font-medium', COR_MARGEM_CLASSE[cor])}>
                  {COR_MARGEM_LABEL[cor]}
                </span>
                <span className="text-xs text-muted-foreground">{faixa}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Button
        className="self-start"
        disabled={isExecuting}
        onClick={() => execute(config)}
      >
        {isExecuting ? 'Salvando...' : 'Salvar precificação'}
      </Button>
    </div>
  )
}
