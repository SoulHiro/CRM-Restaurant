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
import { Checkbox } from '@repo/ui/components/checkbox'
import { Input } from '@repo/ui/components/input'
import { Skeleton } from '@repo/ui/components/skeleton'

import {
  atualizarPratoAction,
  criarPratoAction,
  listarCatalogoAction,
} from '../lib/actions'
import type { PratoCatalogoItem } from '../lib/types'

export function CatalogoSection({ empresaId }: { empresaId: string }) {
  const [pratos, setPratos] = useState<PratoCatalogoItem[] | null>(null)
  const [nomeNovo, setNomeNovo] = useState('')

  const { execute: buscar, isExecuting: carregando } = useAction(
    listarCatalogoAction,
    {
      onSuccess: ({ data }) => setPratos(data?.catalogo ?? []),
      onError: () => toast.error('Não foi possível carregar o catálogo'),
    }
  )

  useEffect(() => {
    setPratos(null)
    buscar({ empresaId })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId])

  const { execute: criar, isExecuting: criando } = useAction(criarPratoAction, {
    onSuccess: () => {
      toast.success('Prato adicionado')
      setNomeNovo('')
      buscar({ empresaId })
    },
    onError: ({ error }) =>
      toast.error(error.serverError ?? 'Não foi possível adicionar o prato'),
  })

  const { execute: atualizar } = useAction(atualizarPratoAction, {
    onSuccess: () => buscar({ empresaId }),
    onError: () => toast.error('Não foi possível atualizar o prato'),
  })

  function adicionar() {
    if (!nomeNovo.trim()) return
    criar({ empresaId, nome: nomeNovo.trim() })
  }

  return (
    <Card className="border-0">
      <CardHeader>
        <CardTitle className="text-base">Catálogo de pratos</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          O pool de pratos dessa empresa — quanto mais pratos, menos repete o
          &quot;prato do dia&quot; ao longo do mês. Desativar um prato tira ele
          do próximo sorteio, sem apagar o histórico.
        </p>

        <div className="flex items-center gap-2">
          <Input
            value={nomeNovo}
            onChange={(e) => setNomeNovo(e.target.value)}
            placeholder="Ex: Frango a passarinho"
            onKeyDown={(e) => e.key === 'Enter' && adicionar()}
          />
          <Button
            size="sm"
            disabled={criando || !nomeNovo.trim()}
            onClick={adicionar}
          >
            <Plus className="size-4" />
            Adicionar
          </Button>
        </div>

        {carregando || !pratos ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : pratos.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum prato cadastrado ainda.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {pratos.map((prato) => (
              <label
                key={prato.id}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
              >
                <Checkbox
                  checked={prato.ativo}
                  onCheckedChange={(v) =>
                    atualizar({
                      pratoId: prato.id,
                      nome: prato.nome,
                      ativo: v === true,
                    })
                  }
                />
                <span
                  className={
                    prato.ativo ? '' : 'text-muted-foreground line-through'
                  }
                >
                  {prato.nome}
                </span>
              </label>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
