'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'

import { Input } from '@repo/ui/components/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select'

import { formatarCentavosBRL } from '../../lib/dinheiro'
import type { ProdutoLancamento } from '../../lib/types'

/**
 * Onde `temTamanhos`, o clique não lança direto — abre o seletor de tamanho
 * embutido no próprio card, pra não precisar de um diálogo à parte.
 */
export function SeletorProduto({
  produtos,
  onLancar,
}: {
  produtos: ProdutoLancamento[]
  onLancar: (produtoId: string, produtoTamanhoId?: string) => void
}) {
  const [codigoRapido, setCodigoRapido] = useState('')
  const [busca, setBusca] = useState('')

  const porCodigo = useMemo(() => {
    const mapa = new Map<number, ProdutoLancamento>()
    for (const p of produtos) if (p.codigoRapido != null) mapa.set(p.codigoRapido, p)
    return mapa
  }, [produtos])

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return produtos
    return produtos.filter((p) => p.nome.toLowerCase().includes(termo))
  }, [produtos, busca])

  function lancarPorCodigo() {
    const numero = Number(codigoRapido)
    const produto = porCodigo.get(numero)
    if (!produto) return
    if (!produto.temTamanhos) onLancar(produto.id)
    setCodigoRapido('')
  }

  return (
    <div className="flex flex-col gap-3">
      <Input
        placeholder="Código rápido — Enter pra lançar"
        value={codigoRapido}
        onChange={(e) => setCodigoRapido(e.target.value.replace(/\D/g, ''))}
        onKeyDown={(e) => e.key === 'Enter' && lancarPorCodigo()}
        inputMode="numeric"
      />

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input
          placeholder="Buscar produto..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-8"
        />
      </div>

      <div className="grid max-h-80 grid-cols-1 gap-1.5 overflow-y-auto sm:grid-cols-2">
        {filtrados.map((produto) => (
          <CardProduto key={produto.id} produto={produto} onLancar={onLancar} />
        ))}
      </div>
    </div>
  )
}

function CardProduto({
  produto,
  onLancar,
}: {
  produto: ProdutoLancamento
  onLancar: (produtoId: string, produtoTamanhoId?: string) => void
}) {
  const [tamanhoSelecionado, setTamanhoSelecionado] = useState<string>('')

  if (produto.temTamanhos) {
    return (
      <div className="flex items-center gap-2 rounded-md border p-2 text-sm">
        <span className="flex-1 truncate">{produto.nome}</span>
        <Select
          value={tamanhoSelecionado}
          onValueChange={(value) => {
            setTamanhoSelecionado('')
            onLancar(produto.id, value)
          }}
        >
          <SelectTrigger className="h-8 w-28 text-xs">
            <SelectValue placeholder="Tamanho" />
          </SelectTrigger>
          <SelectContent>
            {produto.tamanhos.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.nome} — {formatarCentavosBRL(t.precoVendaCentavos)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onLancar(produto.id)}
      className="flex items-center justify-between gap-2 rounded-md border p-2 text-left text-sm hover:bg-muted"
    >
      <span className="truncate">
        {produto.codigoRapido != null && (
          <span className="text-muted-foreground">#{produto.codigoRapido} </span>
        )}
        {produto.nome}
      </span>
      <span className="shrink-0 font-medium">
        {produto.precoVendaCentavos != null
          ? formatarCentavosBRL(produto.precoVendaCentavos)
          : '—'}
      </span>
    </button>
  )
}
