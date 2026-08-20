'use client'

import { useEffect, useState } from 'react'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'

import { Button } from '@repo/ui/components/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card'
import { Input } from '@repo/ui/components/input'
import { Label } from '@repo/ui/components/label'
import { Skeleton } from '@repo/ui/components/skeleton'

import {
  obterPrecosEmpresaAction,
  salvarPrecosEmpresaAction,
} from '../../../../lib/actions'
import type {
  EmpresaPrecoModo,
  PrecoPadraoTipo,
  PrecosPadraoEmpresa,
} from '../../../../lib/types'

export function ValoresTab({
  empresaId,
  precoModo,
  pedeCafe,
  pedeLanche,
  pedeSuco,
}: {
  empresaId: string
  precoModo: EmpresaPrecoModo
  pedeCafe: boolean
  pedeLanche: boolean
  pedeSuco: boolean
}) {
  const tiposMarmita: PrecoPadraoTipo[] =
    precoModo === 'unico' ? ['marmita_unica'] : ['marmita_p', 'marmita_m', 'marmita_g']

  const tiposExtras: PrecoPadraoTipo[] = []
  if (pedeCafe) tiposExtras.push('cafe')
  if (pedeSuco) tiposExtras.push('suco')
  if (pedeLanche) tiposExtras.push('lanche')

  const tiposOutros: PrecoPadraoTipo[] = ['garrafa_cafe_adicional']

  const grupos: { titulo: string; tipos: PrecoPadraoTipo[] }[] = [
    { titulo: 'Marmita', tipos: tiposMarmita },
    { titulo: 'Café, suco e lanche', tipos: tiposExtras },
    { titulo: 'Outros', tipos: tiposOutros },
  ].filter((grupo) => grupo.tipos.length > 0)

  const [precos, setPrecos] = useState<PrecosPadraoEmpresa | null>(null)

  const { execute: buscar, isExecuting: carregando } = useAction(
    obterPrecosEmpresaAction,
    {
      onSuccess: ({ data }) => setPrecos(data?.precos ?? null),
      onError: () => toast.error('Não foi possível carregar os valores'),
    }
  )

  useEffect(() => {
    buscar({ empresaId })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId])

  const { execute: salvar, isExecuting: salvando } = useAction(
    salvarPrecosEmpresaAction,
    {
      onSuccess: () => toast.success('Valores salvos'),
      onError: () => toast.error('Não foi possível salvar os valores'),
    }
  )

  function atualizar(
    tipo: PrecoPadraoTipo,
    campo: 'nome' | 'preco',
    valor: string
  ) {
    setPrecos((atual) => {
      if (!atual) return atual
      return {
        ...atual,
        [tipo]: {
          ...atual[tipo],
          [campo]: campo === 'preco' ? Number(valor) || 0 : valor,
        },
      }
    })
  }

  function salvarTudo() {
    if (!precos) return
    salvar({
      empresaId,
      itens: (Object.keys(precos) as PrecoPadraoTipo[]).map((tipo) => ({
        tipo,
        nome: precos[tipo].nome,
        preco: precos[tipo].preco,
      })),
    })
  }

  if (carregando || !precos) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        Valores padrão dessa empresa — pré-preenchem &quot;Finalizar dia&quot;
        e &quot;Adicionar pedido&quot; (lanche), sem precisar digitar tudo de
        novo toda vez.
      </p>

      {grupos.map((grupo) => (
        <Card key={grupo.titulo} className="border-0">
          <CardHeader>
            <CardTitle className="text-base">{grupo.titulo}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {grupo.tipos.map((tipo) => (
              <div key={tipo} className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">Nome</Label>
                  <Input
                    value={precos[tipo].nome}
                    onChange={(e) => atualizar(tipo, 'nome', e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">Valor (R$)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={precos[tipo].preco}
                    onChange={(e) => atualizar(tipo, 'preco', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <Button className="self-start" disabled={salvando} onClick={salvarTudo}>
        {salvando ? 'Salvando...' : 'Salvar valores'}
      </Button>
    </div>
  )
}
