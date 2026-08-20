'use client'

import { useState } from 'react'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'

import { Button } from '@repo/ui/components/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card'
import { Checkbox } from '@repo/ui/components/checkbox'
import { Label } from '@repo/ui/components/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select'

import { atualizarConfiguracaoEmpresaAction } from '../../../lib/actions'
import type {
  EmpresaFluxoPedido,
  EmpresaListItem,
  EmpresaPrecoModo,
} from '../../../lib/types'

export function ConfiguracoesTab({ empresa }: { empresa: EmpresaListItem }) {
  const [fluxoPedido, setFluxoPedido] = useState<EmpresaFluxoPedido>(
    empresa.fluxoPedido
  )
  const [resumoMostraQuantidades, setResumoMostraQuantidades] = useState(
    empresa.resumoMostraQuantidades
  )
  const [precoModo, setPrecoModo] = useState<EmpresaPrecoModo>(
    empresa.precoModo
  )
  const [pedeCafe, setPedeCafe] = useState(empresa.pedeCafe)
  const [pedeLanche, setPedeLanche] = useState(empresa.pedeLanche)
  const [pedeSuco, setPedeSuco] = useState(empresa.pedeSuco)

  const { execute, isExecuting } = useAction(
    atualizarConfiguracaoEmpresaAction,
    {
      onSuccess: () => toast.success('Configurações salvas'),
      onError: () => toast.error('Não foi possível salvar as configurações'),
    }
  )

  function salvar() {
    execute({
      empresaId: empresa.id,
      fluxoPedido,
      resumoMostraQuantidades,
      precoModo,
      pedeCafe,
      pedeLanche,
      pedeSuco,
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        Como essa empresa funciona no dia a dia — muda o que aparece em
        Valores, Finalizar dia e no resumo impresso.
      </p>

      <Card className="border-0">
        <CardHeader>
          <CardTitle className="text-base">Fluxo de pedido</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Tipo de fluxo</Label>
            <Select
              value={fluxoPedido}
              onValueChange={(v) => setFluxoPedido(v as EmpresaFluxoPedido)}
            >
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="padrao">
                  Padrão — comanda individual por pessoa
                </SelectItem>
                <SelectItem value="pesagem">
                  Pesagem em massa — parte do dia é preparada em lote
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={resumoMostraQuantidades}
              onCheckedChange={(v) => setResumoMostraQuantidades(v === true)}
            />
            Mostrar quantidades (P/M/G/Lanche/Café/Suco) no resumo do dia
          </label>
        </CardContent>
      </Card>

      <Card className="border-0">
        <CardHeader>
          <CardTitle className="text-base">Preço da marmita</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Modo de preço</Label>
            <Select
              value={precoModo}
              onValueChange={(v) => setPrecoModo(v as EmpresaPrecoModo)}
            >
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="por_tamanho">
                  Por tamanho — P/M/G com preços diferentes
                </SelectItem>
                <SelectItem value="unico">
                  Preço único — mesmo valor pra qualquer marmita
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0">
        <CardHeader>
          <CardTitle className="text-base">Itens extras</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={pedeCafe}
              onCheckedChange={(v) => setPedeCafe(v === true)}
            />
            Pede café
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={pedeLanche}
              onCheckedChange={(v) => setPedeLanche(v === true)}
            />
            Pede lanche
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={pedeSuco}
              onCheckedChange={(v) => setPedeSuco(v === true)}
            />
            Pede suco
          </label>
        </CardContent>
      </Card>

      <Button className="self-start" disabled={isExecuting} onClick={salvar}>
        {isExecuting ? 'Salvando...' : 'Salvar configurações'}
      </Button>
    </div>
  )
}
