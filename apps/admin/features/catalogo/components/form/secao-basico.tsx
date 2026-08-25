'use client'

import { useState } from 'react'
import { useAction } from 'next-safe-action/hooks'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@repo/ui/components/button'
import { Card, CardContent } from '@repo/ui/components/card'
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
import { ToggleGroup, ToggleGroupItem } from '@repo/ui/components/toggle-group'

import { criarCategoriaProdutoAction } from '../../lib/actions'
import { TIPO_PRODUTO_LABEL, TIPOS_PRODUTO } from '../../lib/types'
import type {
  CategoriaProdutoOption,
  CriarProdutoInput,
  TipoProduto,
} from '../../lib/types'

const SEM_CATEGORIA = '__nenhuma__'

export function SecaoBasico({
  dados,
  onChange,
  categoriasIniciais,
}: {
  dados: CriarProdutoInput
  onChange: (parcial: Partial<CriarProdutoInput>) => void
  categoriasIniciais: CategoriaProdutoOption[]
}) {
  const [categorias, setCategorias] = useState(categoriasIniciais)
  const [novaCategoria, setNovaCategoria] = useState('')

  const { execute: criarCategoria, isExecuting: criandoCategoria } = useAction(
    criarCategoriaProdutoAction,
    {
      onSuccess: ({ data }) => {
        if (!data) return
        setCategorias((atual) => [...atual, data])
        onChange({ categoriaId: data.id })
        setNovaCategoria('')
      },
      onError: () => toast.error('Não foi possível criar a categoria'),
    }
  )

  return (
    <Card className="border-0">
      <CardContent className="flex flex-col gap-4 p-6">
        <div className="flex flex-col gap-1.5">
          <Label className="text-sm">Nome do produto</Label>
          <Input
            value={dados.nome}
            onChange={(e) => onChange({ nome: e.target.value })}
            placeholder="Ex: Marmita de feijoada"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Tipo</Label>
            <ToggleGroup
              type="single"
              variant="outline"
              value={dados.tipo}
              onValueChange={(v) => v && onChange({ tipo: v as TipoProduto })}
              className="justify-start"
            >
              {TIPOS_PRODUTO.map((t) => (
                <ToggleGroupItem key={t} value={t}>
                  {TIPO_PRODUTO_LABEL[t]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Categoria</Label>
            <Select
              value={dados.categoriaId ?? SEM_CATEGORIA}
              onValueChange={(v) =>
                onChange({ categoriaId: v === SEM_CATEGORIA ? null : v })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Sem categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SEM_CATEGORIA}>Sem categoria</SelectItem>
                {categorias.map((categoria) => (
                  <SelectItem key={categoria.id} value={categoria.id}>
                    {categoria.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Input
                value={novaCategoria}
                onChange={(e) => setNovaCategoria(e.target.value)}
                placeholder="Nova categoria..."
                className="h-8"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={novaCategoria.trim().length === 0 || criandoCategoria}
                onClick={() => criarCategoria({ nome: novaCategoria.trim() })}
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-sm">Descrição</Label>
          <Textarea
            value={dados.descricao}
            onChange={(e) => onChange({ descricao: e.target.value })}
            rows={3}
            placeholder="O que vem no prato/lanche..."
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">URL da foto</Label>
            <Input
              value={dados.fotoUrl}
              onChange={(e) => onChange({ fotoUrl: e.target.value })}
              placeholder="https://..."
            />
            <p className="text-xs text-muted-foreground">
              Cole o link de uma imagem já hospedada — upload direto ainda
              não está disponível.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">URL do vídeo</Label>
            <Input
              value={dados.videoUrl}
              onChange={(e) => onChange({ videoUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
