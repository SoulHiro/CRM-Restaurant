'use client'

import { useEffect, useState } from 'react'
import { useAction } from 'next-safe-action/hooks'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@repo/ui/components/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card'
import { EmptyState } from '@repo/ui/components/empty-state'
import { Input } from '@repo/ui/components/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select'
import { Skeleton } from '@repo/ui/components/skeleton'

import { atualizarPratoAction, criarPratoAction, listarCatalogoAction } from '../lib/actions'
import {
  CATEGORIA_PRATO_ICON,
  CATEGORIA_PRATO_LABEL,
  CATEGORIAS_PRATO,
  type CategoriaPrato,
} from '../lib/categoria-prato'
import type { PratoCatalogoItem } from '../lib/types'
import { PratosCatalogoItem } from './pratos-catalogo-item'

export function PratosCatalogoList() {
  const [pratos, setPratos] = useState<PratoCatalogoItem[] | null>(null)
  const [nomeNovo, setNomeNovo] = useState('')
  const [categoriaNova, setCategoriaNova] = useState<CategoriaPrato>('outros')

  const { execute: buscar } = useAction(listarCatalogoAction, {
    onSuccess: ({ data }) => setPratos(data?.catalogo ?? []),
    onError: () => toast.error('Não foi possível carregar o catálogo'),
  })

  useEffect(() => {
    buscar({})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { execute: criar, isExecuting: criando } = useAction(
    criarPratoAction,
    {
      onSuccess: () => {
        setNomeNovo('')
        buscar({})
      },
      onError: ({ error }) =>
        toast.error(error.serverError ?? 'Não foi possível criar o prato'),
    }
  )

  const { execute: atualizar } = useAction(atualizarPratoAction, {
    onSuccess: () => buscar({}),
    onError: () => toast.error('Não foi possível atualizar a categoria'),
  })

  function adicionar() {
    if (!nomeNovo.trim()) return
    criar({ nome: nomeNovo.trim(), categoria: categoriaNova })
  }

  const grupos = CATEGORIAS_PRATO.map((categoria) => ({
    categoria,
    itens: (pratos ?? []).filter((p) => p.categoria === categoria),
  })).filter((grupo) => grupo.itens.length > 0)

  return (
    <Card className="border-0">
      <CardHeader>
        <CardTitle className="text-base">Pratos</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <Input
            placeholder="Nome do prato"
            value={nomeNovo}
            onChange={(e) => setNomeNovo(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && adicionar()}
          />
          <div className="flex items-center gap-2">
            <Select
              value={categoriaNova}
              onValueChange={(v) => setCategoriaNova(v as CategoriaPrato)}
            >
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIAS_PRATO.map((categoria) => (
                  <SelectItem key={categoria} value={categoria}>
                    {CATEGORIA_PRATO_LABEL[categoria]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="icon"
              disabled={criando || !nomeNovo.trim()}
              onClick={adicionar}
              aria-label="Adicionar prato"
            >
              <Plus className="size-4" />
            </Button>
          </div>
        </div>

        {!pratos ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : pratos.length === 0 ? (
          <EmptyState message="Nenhum prato cadastrado ainda." />
        ) : (
          <div className="flex flex-col gap-4">
            {grupos.map((grupo) => {
              const Icone = CATEGORIA_PRATO_ICON[grupo.categoria]
              return (
                <div key={grupo.categoria} className="flex flex-col gap-1.5">
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <Icone className="size-3.5" />
                    {CATEGORIA_PRATO_LABEL[grupo.categoria]}
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {grupo.itens.map((prato) => (
                      <PratosCatalogoItem
                        key={prato.id}
                        prato={prato}
                        onMudarCategoria={(categoria) =>
                          atualizar({
                            pratoId: prato.id,
                            nome: prato.nome,
                            ativo: prato.ativo,
                            categoria,
                          })
                        }
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
