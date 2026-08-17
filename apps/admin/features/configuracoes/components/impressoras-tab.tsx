'use client'

import { useState } from 'react'
import { useAction } from 'next-safe-action/hooks'
import { Printer, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@repo/ui/components/button'
import { EmptyState } from '@repo/ui/components/empty-state'
import { Input } from '@repo/ui/components/input'
import { Label } from '@repo/ui/components/label'
import { cn } from '@repo/ui/lib/utils'

import { criarImpressoraAction } from '../lib/actions'
import type { ImpressoraOption } from '../lib/types'

export function ImpressorasTab({
  impressoras,
  onCriada,
}: {
  impressoras: ImpressoraOption[]
  onCriada: (impressora: ImpressoraOption) => void
}) {
  const [nome, setNome] = useState('')
  const [identificadorQz, setIdentificadorQz] = useState('')
  const [detectadas, setDetectadas] = useState<string[] | null>(null)
  const [detectando, setDetectando] = useState(false)

  const { execute, isExecuting } = useAction(criarImpressoraAction, {
    onSuccess: ({ data }) => {
      if (!data) return
      toast.success('Impressora cadastrada')
      onCriada(data)
      setNome('')
      setIdentificadorQz('')
    },
    onError: () => toast.error('Não foi possível cadastrar a impressora'),
  })

  async function detectar() {
    setDetectando(true)
    try {
      const { listarImpressorasDetectadas } = await import('@/lib/qz-print')
      const encontradas = await listarImpressorasDetectadas()
      setDetectadas(encontradas)
      if (encontradas.length === 0) {
        toast.info('O QZ Tray não encontrou nenhuma impressora.')
      }
    } catch {
      toast.error(
        'Não foi possível conectar ao QZ Tray. Confira se ele está aberto.'
      )
    } finally {
      setDetectando(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-lg bg-card p-4">
        <div className="flex flex-col gap-1.5">
          <Label className="text-sm">Nome</Label>
          <Input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Elgin i9 — Caixa"
            className="sm:max-w-72"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Impressora detectada</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={detectando}
              onClick={detectar}
            >
              <RefreshCw className={detectando ? 'size-3.5 animate-spin' : 'size-3.5'} />
              {detectando ? 'Procurando...' : 'Procurar no QZ Tray'}
            </Button>
          </div>
          {detectadas === null ? (
            <p className="text-sm text-muted-foreground">
              Clique em &quot;Procurar no QZ Tray&quot; pra listar as
              impressoras disponíveis nesta máquina.
            </p>
          ) : detectadas.length === 0 ? (
            <EmptyState message="Nenhuma impressora encontrada pelo QZ Tray." />
          ) : (
            <div className="flex flex-col gap-2">
              {detectadas.map((nomeDetectado) => (
                <button
                  key={nomeDetectado}
                  type="button"
                  onClick={() => setIdentificadorQz(nomeDetectado)}
                  aria-pressed={identificadorQz === nomeDetectado}
                  className={cn(
                    'flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                    identificadorQz === nomeDetectado
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-accent'
                  )}
                >
                  <span className="truncate">{nomeDetectado}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <Button
          className="self-start"
          disabled={isExecuting || !nome.trim() || !identificadorQz}
          onClick={() => execute({ nome, identificadorQz })}
        >
          {isExecuting ? 'Salvando...' : 'Salvar impressora'}
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-sm">Impressoras cadastradas</Label>
        {impressoras.length === 0 ? (
          <EmptyState message="Nenhuma impressora cadastrada ainda." />
        ) : (
          <div className="flex flex-col gap-2">
            {impressoras.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-lg bg-muted px-3 py-2.5"
              >
                <Printer className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate text-sm">{item.nome}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
