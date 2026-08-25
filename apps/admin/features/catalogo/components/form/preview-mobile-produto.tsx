'use client'

import { Eye, ImageOff } from 'lucide-react'

import { Badge } from '@repo/ui/components/badge'
import { Card, CardContent } from '@repo/ui/components/card'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@repo/ui/components/dialog'

import { formatCurrencyBRL } from '@/lib/formatters'
import { CLASSIFICACOES } from '../../lib/classificacoes'
import { calcularPrecoComDesconto } from '../../lib/precificacao-helpers'
import type { CategoriaProdutoOption, CriarProdutoInput } from '../../lib/types'

/** Preço de referência do produto: único, ou o menor entre os tamanhos ("a partir de"). */
function precoBase(dados: CriarProdutoInput): number {
  if (!dados.temTamanhos) return dados.precoVenda
  if (dados.tamanhos.length === 0) return 0
  return Math.min(...dados.tamanhos.map((t) => t.precoVenda))
}

function ImagemProduto({
  fotoUrl,
  className,
}: {
  fotoUrl: string
  className: string
}) {
  return (
    <div className={className}>
      {fotoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={fotoUrl} alt="" className="size-full object-cover" />
      ) : (
        <div className="flex size-full items-center justify-center">
          <ImageOff className="size-6 text-muted-foreground" />
        </div>
      )}
    </div>
  )
}

/** Card do produto como aparece de fato no cardápio digital — usado só na moldura de celular. */
function CartaoProdutoCardapio({
  dados,
  categoriaNome,
}: {
  dados: CriarProdutoInput
  categoriaNome: string | null
}) {
  const preco = precoBase(dados)
  const temDesconto = dados.descontoValor != null && dados.descontoValor > 0
  const precoFinal = calcularPrecoComDesconto(
    preco,
    dados.descontoTipo,
    dados.descontoValor
  )

  const classificacoesEscolhidas = CLASSIFICACOES.filter((c) =>
    dados.classificacoes.includes(c.key)
  )

  return (
    <div className="overflow-hidden rounded-xl bg-card shadow">
      <ImagemProduto fotoUrl={dados.fotoUrl} className="aspect-video w-full bg-muted" />

      <div className="flex flex-col gap-1 p-3">
        {categoriaNome && (
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {categoriaNome}
          </span>
        )}
        <span className="truncate text-sm font-semibold">
          {dados.nome.trim() || 'Nome do produto'}
        </span>

        {dados.descricao && (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {dados.descricao}
          </p>
        )}

        <div className="flex items-baseline gap-2 pt-1">
          {dados.temTamanhos && (
            <span className="text-[10px] text-muted-foreground">
              A partir de
            </span>
          )}
          {temDesconto && (
            <span className="text-xs text-muted-foreground line-through">
              {formatCurrencyBRL(preco)}
            </span>
          )}
          <span className="text-sm font-bold tabular-nums">
            {formatCurrencyBRL(precoFinal)}
          </span>
        </div>

        {classificacoesEscolhidas.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {classificacoesEscolhidas.map((c) => (
              <Badge key={c.key} variant="outline" className="text-[10px]">
                {c.nome}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/** Moldura simples de celular — só pra dar o contexto de "isso é uma tela mobile". */
function MolduraCelular({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-[220px] flex-col gap-1 rounded-[1.75rem] border-8 border-sidebar bg-sidebar p-2">
      <div className="mx-auto h-1.5 w-10 rounded-full bg-sidebar-foreground/30" />
      <div className="overflow-hidden rounded-2xl">{children}</div>
    </div>
  )
}

export function PreviewMobileProduto({
  dados,
  categorias,
}: {
  dados: CriarProdutoInput
  categorias: CategoriaProdutoOption[]
}) {
  const categoriaNome =
    categorias.find((c) => c.id === dados.categoriaId)?.nome ?? null

  const preco = precoBase(dados)
  const temDesconto = dados.descontoValor != null && dados.descontoValor > 0
  const precoFinal = calcularPrecoComDesconto(
    preco,
    dados.descontoTipo,
    dados.descontoValor
  )

  return (
    <Card className="border-0">
      <CardContent className="flex flex-col gap-3 p-4">
        <span className="text-xs text-muted-foreground">
          Prévia do cardápio
        </span>

        <ImagemProduto
          fotoUrl={dados.fotoUrl}
          className="aspect-video w-full overflow-hidden rounded-lg bg-muted"
        />

        <div className="flex items-start gap-2">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-sm font-semibold">
              {dados.nome.trim() || 'Nome do produto'}
            </span>
            {dados.descricao && (
              <p className="line-clamp-2 text-xs text-muted-foreground">
                {dados.descricao}
              </p>
            )}
            <div className="flex items-baseline gap-2 pt-0.5">
              {dados.temTamanhos && (
                <span className="text-[10px] text-muted-foreground">
                  A partir de
                </span>
              )}
              {temDesconto && (
                <span className="text-xs text-muted-foreground line-through">
                  {formatCurrencyBRL(preco)}
                </span>
              )}
              <span className="text-sm font-bold tabular-nums">
                {formatCurrencyBRL(precoFinal)}
              </span>
            </div>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <button
                type="button"
                aria-label="Ver prévia no celular"
                className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-accent"
              >
                <Eye className="size-4" />
              </button>
            </DialogTrigger>
            <DialogContent className="flex flex-col items-center gap-4">
              <DialogTitle className="text-base">
                Como aparece no cardápio
              </DialogTitle>
              <MolduraCelular>
                <CartaoProdutoCardapio
                  dados={dados}
                  categoriaNome={categoriaNome}
                />
              </MolduraCelular>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  )
}
