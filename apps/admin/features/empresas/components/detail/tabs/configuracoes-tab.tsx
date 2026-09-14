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
import { Input } from '@repo/ui/components/input'
import { Label } from '@repo/ui/components/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select'
import { Textarea } from '@repo/ui/components/textarea'

import { slugify, urlFormularioPublico } from '@/lib/urls'
import {
  atualizarAvisoCardapioAction,
  atualizarConfiguracaoEmpresaAction,
  atualizarSlugEmpresaAction,
} from '../../../lib/actions'
import type {
  EmpresaFluxoPedido,
  EmpresaListItem,
  EmpresaPrecoModo,
} from '../../../lib/types'
import { ExtrasCardapioSection } from './extras-cardapio-section'

export function ConfiguracoesTab({ empresa }: { empresa: EmpresaListItem }) {
  const [slug, setSlug] = useState(empresa.slug ?? slugify(empresa.nome))
  const { execute: salvarSlug, isExecuting: salvandoSlug } = useAction(
    atualizarSlugEmpresaAction,
    {
      onSuccess: () => toast.success('Link do formulário salvo'),
      onError: ({ error }) =>
        toast.error(error.serverError ?? 'Não foi possível salvar o link'),
    }
  )

  const [avisoCardapio, setAvisoCardapio] = useState(
    empresa.avisoCardapio ?? ''
  )
  const { execute: salvarAviso, isExecuting: salvandoAviso } = useAction(
    atualizarAvisoCardapioAction,
    {
      onSuccess: () => toast.success('Aviso salvo'),
      onError: () => toast.error('Não foi possível salvar o aviso'),
    }
  )

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
  const [cardapioQtdAlternativas, setCardapioQtdAlternativas] = useState(
    String(empresa.cardapioQtdAlternativas)
  )

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
      cardapioQtdAlternativas: Number(cardapioQtdAlternativas) || 0,
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        Como essa empresa funciona no dia a dia — muda o que aparece em Valores,
        Finalizar dia e no resumo impresso.
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
          <CardTitle className="text-base">Link do formulário</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Label className="text-sm">Endereço público</Label>
          <p className="text-xs text-muted-foreground">
            Onde os funcionários dessa empresa respondem o cardápio da
            semana. Sem espaço ou acento — só letras minúsculas, números e
            hífen.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {urlFormularioPublico('')}
            </span>
            <Input
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
              className="w-56"
            />
            <Button
              size="sm"
              disabled={salvandoSlug || slug.length < 3}
              onClick={() => salvarSlug({ empresaId: empresa.id, slug })}
            >
              {salvandoSlug ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>

          <div className="flex flex-col gap-1.5 border-t pt-4">
            <Label className="text-sm">
              Aviso no topo do formulário (opcional)
            </Label>
            <p className="text-xs text-muted-foreground">
              Pra avisos de contrato específicos dessa empresa — ex:
              &ldquo;Todos os pratos acompanham Salada, Legumes, Sobremesa e
              Suco&rdquo;. Deixe em branco pra não mostrar nada.
            </p>
            <Textarea
              value={avisoCardapio}
              onChange={(e) => setAvisoCardapio(e.target.value)}
              maxLength={500}
              rows={3}
            />
            <Button
              size="sm"
              className="self-start"
              disabled={salvandoAviso}
              onClick={() =>
                salvarAviso({ empresaId: empresa.id, avisoCardapio })
              }
            >
              {salvandoAviso ? 'Salvando...' : 'Salvar aviso'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0">
        <CardHeader>
          <CardTitle className="text-base">Cardápio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">
              Quantas alternativas mostrar na página pública
            </Label>
            <p className="text-xs text-muted-foreground">
              O prato do dia e as alternativas são gerados uma vez só pro
              restaurante inteiro — isso aqui só corta quantas dessas
              alternativas essa empresa enxerga.
            </p>
            <Input
              type="number"
              min="0"
              max="30"
              className="max-w-32"
              value={cardapioQtdAlternativas}
              onChange={(e) => setCardapioQtdAlternativas(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <ExtrasCardapioSection empresaId={empresa.id} empresaNome={empresa.nome} />

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
