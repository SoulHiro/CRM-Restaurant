'use client'

import { useState } from 'react'
import { ImageOff } from 'lucide-react'

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@repo/ui/components/tabs'

import { formatCurrencyBRL } from '@/lib/formatters'
import type { CategoriaProdutoOption } from '@/features/catalogo/lib/types'
import type { ProdutoConsumivelOption } from '../lib/types'

const SEM_CATEGORIA = '__sem_categoria__'

export function ProdutoPicker({
  produtos,
  categorias,
  onSelecionar,
  desabilitado,
}: {
  produtos: ProdutoConsumivelOption[]
  categorias: CategoriaProdutoOption[]
  onSelecionar: (produto: ProdutoConsumivelOption) => void
  desabilitado: boolean
}) {
  const categoriasComProduto = categorias.filter((categoria) =>
    produtos.some((p) => p.categoriaId === categoria.id)
  )
  const temSemCategoria = produtos.some((p) => p.categoriaId === null)

  const primeiraAba = categoriasComProduto[0]?.id ?? SEM_CATEGORIA
  const [aba, setAba] = useState(primeiraAba)

  if (produtos.length === 0) {
    return (
      <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
        Nenhum produto ativo no cardápio ainda.
      </p>
    )
  }

  return (
    <Tabs value={aba} onValueChange={setAba}>
      <TabsList className="flex w-full flex-wrap justify-start bg-sidebar">
        {categoriasComProduto.map((categoria) => (
          <TabsTrigger key={categoria.id} value={categoria.id}>
            {categoria.nome}
          </TabsTrigger>
        ))}
        {temSemCategoria && (
          <TabsTrigger value={SEM_CATEGORIA}>Outros</TabsTrigger>
        )}
      </TabsList>

      {categoriasComProduto.map((categoria) => (
        <TabsContent key={categoria.id} value={categoria.id} className="mt-3">
          <GradeProdutos
            produtos={produtos.filter((p) => p.categoriaId === categoria.id)}
            onSelecionar={onSelecionar}
            desabilitado={desabilitado}
          />
        </TabsContent>
      ))}

      {temSemCategoria && (
        <TabsContent value={SEM_CATEGORIA} className="mt-3">
          <GradeProdutos
            produtos={produtos.filter((p) => p.categoriaId === null)}
            onSelecionar={onSelecionar}
            desabilitado={desabilitado}
          />
        </TabsContent>
      )}
    </Tabs>
  )
}

function GradeProdutos({
  produtos,
  onSelecionar,
  desabilitado,
}: {
  produtos: ProdutoConsumivelOption[]
  onSelecionar: (produto: ProdutoConsumivelOption) => void
  desabilitado: boolean
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
      {produtos.map((produto) => (
        <button
          key={produto.id}
          type="button"
          disabled={desabilitado}
          onClick={() => onSelecionar(produto)}
          className="flex cursor-pointer flex-col gap-2 overflow-hidden rounded-xl bg-card text-left shadow transition-colors hover:bg-accent/50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <div className="flex aspect-square w-full items-center justify-center bg-muted">
            {produto.fotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={produto.fotoUrl}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <ImageOff className="size-6 text-muted-foreground" />
            )}
          </div>
          <div className="flex flex-col gap-0.5 p-2 pt-0">
            <span className="line-clamp-1 text-sm font-medium">
              {produto.nome}
            </span>
            <span className="text-xs font-semibold tabular-nums text-muted-foreground">
              {formatCurrencyBRL(produto.precoVenda)}
            </span>
          </div>
        </button>
      ))}
    </div>
  )
}
