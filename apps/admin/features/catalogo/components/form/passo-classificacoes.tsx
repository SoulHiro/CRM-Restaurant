'use client'

import { useState } from 'react'
import { useAction } from 'next-safe-action/hooks'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@repo/ui/components/button'
import { Input } from '@repo/ui/components/input'
import { Label } from '@repo/ui/components/label'
import { cn } from '@repo/ui/lib/utils'

import { formatCurrencyBRL } from '@/lib/formatters'
import {
  criarAdicionalAction,
  criarClassificacaoAction,
} from '../../lib/actions'
import type {
  AdicionalOption,
  ClassificacaoOption,
  CriarProdutoInput,
} from '../../lib/types'

export function PassoClassificacoes({
  dados,
  classificacoesIniciais,
  adicionaisIniciais,
  onAvancar,
  onVoltar,
}: {
  dados: CriarProdutoInput
  classificacoesIniciais: ClassificacaoOption[]
  adicionaisIniciais: AdicionalOption[]
  onAvancar: (dados: Partial<CriarProdutoInput>) => void
  onVoltar: () => void
}) {
  const [classificacoes, setClassificacoes] = useState(classificacoesIniciais)
  const [adicionais, setAdicionais] = useState(adicionaisIniciais)
  const [classificacaoIds, setClassificacaoIds] = useState<Set<string>>(
    new Set(dados.classificacaoIds)
  )
  const [adicionalIds, setAdicionalIds] = useState<Set<string>>(
    new Set(dados.adicionalIds)
  )
  const [novaClassificacao, setNovaClassificacao] = useState('')
  const [novoAdicionalNome, setNovoAdicionalNome] = useState('')
  const [novoAdicionalPreco, setNovoAdicionalPreco] = useState(0)

  const classificacoesFiltradas = classificacoes.filter(
    (c) => c.aplicaA === 'ambos' || c.aplicaA === dados.tipo
  )

  const { execute: criarClassificacao, isExecuting: criandoClassificacao } =
    useAction(criarClassificacaoAction, {
      onSuccess: ({ data }) => {
        if (!data) return
        setClassificacoes((atual) => [...atual, data])
        setClassificacaoIds((atual) => new Set(atual).add(data.id))
        setNovaClassificacao('')
      },
      onError: () => toast.error('Não foi possível criar a classificação'),
    })

  const { execute: criarAdicional, isExecuting: criandoAdicional } = useAction(
    criarAdicionalAction,
    {
      onSuccess: ({ data }) => {
        if (!data) return
        const criado = { ...data, preco: Number(data.preco), ativo: true }
        setAdicionais((atual) => [...atual, criado])
        setAdicionalIds((atual) => new Set(atual).add(data.id))
        setNovoAdicionalNome('')
        setNovoAdicionalPreco(0)
      },
      onError: () => toast.error('Não foi possível criar o adicional'),
    }
  )

  function toggle(set: Set<string>, id: string): Set<string> {
    const novo = new Set(set)
    if (novo.has(id)) novo.delete(id)
    else novo.add(id)
    return novo
  }

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
      <div className="flex flex-col gap-2">
        <Label className="text-sm">Classificações</Label>
        <div className="flex flex-wrap gap-2">
          {classificacoesFiltradas.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() =>
                setClassificacaoIds((atual) => toggle(atual, c.id))
              }
              className={cn(
                'rounded-full border px-3 py-1 text-xs',
                classificacaoIds.has(c.id)
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'text-muted-foreground'
              )}
            >
              {c.nome}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={novaClassificacao}
            onChange={(e) => setNovaClassificacao(e.target.value)}
            placeholder="Nova classificação..."
            className="h-8"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={
              novaClassificacao.trim().length === 0 || criandoClassificacao
            }
            onClick={() =>
              criarClassificacao({
                nome: novaClassificacao.trim(),
                aplicaA: dados.tipo,
              })
            }
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-sm">Adicionais</Label>
        <div className="flex flex-col gap-1">
          {adicionais.map((a) => (
            <label
              key={a.id}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <input
                type="checkbox"
                checked={adicionalIds.has(a.id)}
                onChange={() => setAdicionalIds((atual) => toggle(atual, a.id))}
              />
              {a.nome}
              <span className="text-xs text-muted-foreground">
                {formatCurrencyBRL(a.preco)}
              </span>
            </label>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={novoAdicionalNome}
            onChange={(e) => setNovoAdicionalNome(e.target.value)}
            placeholder="Novo adicional..."
            className="h-8"
          />
          <Input
            type="number"
            min={0}
            step="0.01"
            value={novoAdicionalPreco}
            onChange={(e) => setNovoAdicionalPreco(Number(e.target.value))}
            className="h-8 w-24"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={novoAdicionalNome.trim().length === 0 || criandoAdicional}
            onClick={() =>
              criarAdicional({
                nome: novoAdicionalNome.trim(),
                preco: novoAdicionalPreco,
              })
            }
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </div>

      <div className="mt-auto flex justify-between border-t pt-4">
        <Button variant="outline" onClick={onVoltar}>
          Voltar
        </Button>
        <Button
          onClick={() =>
            onAvancar({
              classificacaoIds: [...classificacaoIds],
              adicionalIds: [...adicionalIds],
            })
          }
        >
          Próximo
        </Button>
      </div>
    </div>
  )
}
