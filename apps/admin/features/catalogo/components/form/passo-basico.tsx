'use client'

import { useState } from 'react'
import { useAction } from 'next-safe-action/hooks'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@repo/ui/components/button'
import { Input } from '@repo/ui/components/input'
import { Label } from '@repo/ui/components/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select'
import { ToggleGroup, ToggleGroupItem } from '@repo/ui/components/toggle-group'

import { criarCategoriaProdutoAction } from '../../lib/actions'
import { TIPO_PRODUTO_LABEL, TIPOS_PRODUTO } from '../../lib/types'
import type {
  CategoriaProdutoOption,
  CriarProdutoInput,
  TipoProduto,
} from '../../lib/types'

export function PassoBasico({
  dados,
  categoriasIniciais,
  onAvancar,
}: {
  dados: CriarProdutoInput
  categoriasIniciais: CategoriaProdutoOption[]
  onAvancar: (dados: Partial<CriarProdutoInput>) => void
}) {
  const [nome, setNome] = useState(dados.nome)
  const [categoriaId, setCategoriaId] = useState(dados.categoriaId)
  const [tipo, setTipo] = useState<TipoProduto>(dados.tipo)
  const [descricao, setDescricao] = useState(dados.descricao)
  const [fotoUrl, setFotoUrl] = useState(dados.fotoUrl)
  const [videoUrl, setVideoUrl] = useState(dados.videoUrl)
  const [categorias, setCategorias] = useState(categoriasIniciais)
  const [novaCategoria, setNovaCategoria] = useState('')

  const { execute: criarCategoria, isExecuting: criandoCategoria } = useAction(
    criarCategoriaProdutoAction,
    {
      onSuccess: ({ data }) => {
        if (!data) return
        setCategorias((atual) => [...atual, data])
        setCategoriaId(data.id)
        setNovaCategoria('')
      },
      onError: () => toast.error('Não foi possível criar a categoria'),
    }
  )

  const podeAvancar = nome.trim().length > 0

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
      <div className="flex flex-col gap-1.5">
        <Label className="text-sm">Nome do produto</Label>
        <Input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex: Marmita de feijoada"
          autoFocus
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-sm">Tipo</Label>
        <ToggleGroup
          type="single"
          variant="outline"
          value={tipo}
          onValueChange={(v) => v && setTipo(v as TipoProduto)}
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
          value={categoriaId ?? '__nenhuma__'}
          onValueChange={(v) => setCategoriaId(v === '__nenhuma__' ? null : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sem categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__nenhuma__">Sem categoria</SelectItem>
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

      <div className="flex flex-col gap-1.5">
        <Label className="text-sm">Descrição</Label>
        <textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          rows={3}
          placeholder="O que vem no prato/lanche..."
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-sm">URL da foto</Label>
        <Input
          value={fotoUrl}
          onChange={(e) => setFotoUrl(e.target.value)}
          placeholder="https://..."
        />
        <p className="text-xs text-muted-foreground">
          Cole o link de uma imagem já hospedada — upload direto ainda não está
          disponível.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-sm">URL do vídeo</Label>
        <Input
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="https://..."
        />
      </div>

      <div className="mt-auto flex justify-end border-t pt-4">
        <Button
          disabled={!podeAvancar}
          onClick={() =>
            onAvancar({
              nome: nome.trim(),
              categoriaId,
              tipo,
              descricao,
              fotoUrl,
              videoUrl,
            })
          }
        >
          Próximo
        </Button>
      </div>
    </div>
  )
}
