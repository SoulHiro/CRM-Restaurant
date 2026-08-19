'use client'

import { useEffect, useState } from 'react'
import { useAction } from 'next-safe-action/hooks'
import { Printer, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@repo/ui/components/button'
import { EmptyState } from '@repo/ui/components/empty-state'
import { Input } from '@repo/ui/components/input'
import { Label } from '@repo/ui/components/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select'
import { cn } from '@repo/ui/lib/utils'

import {
  criarImpressoraAction,
  listarImpressorasPesagemAction,
  obterConfiguracaoPesagemAction,
  salvarConfiguracaoPesagemAction,
} from '../lib/actions'
import type { ImpressoraOption } from '../lib/types'

type TipoImpressora = 'comanda' | 'pesagem'

const SEM_IMPRESSORA = '__sem_impressora__'

export function ImpressorasTab({
  impressoras,
  onCriada,
}: {
  impressoras: ImpressoraOption[]
  onCriada: (impressora: ImpressoraOption) => void
}) {
  const [nome, setNome] = useState('')
  const [identificadorQz, setIdentificadorQz] = useState('')
  const [tipo, setTipo] = useState<TipoImpressora>('comanda')
  const [detectadas, setDetectadas] = useState<string[] | null>(null)
  const [detectando, setDetectando] = useState(false)

  const [impressorasPesagem, setImpressorasPesagem] = useState<
    ImpressoraOption[]
  >([])
  const [impressoraPesagemId, setImpressoraPesagemId] = useState(
    SEM_IMPRESSORA
  )

  const { execute: buscarImpressorasPesagem } = useAction(
    listarImpressorasPesagemAction,
    {
      onSuccess: ({ data }) =>
        setImpressorasPesagem(data?.impressoras ?? []),
    }
  )
  const { execute: buscarConfigPesagem } = useAction(
    obterConfiguracaoPesagemAction,
    {
      onSuccess: ({ data }) =>
        setImpressoraPesagemId(data?.impressoraId ?? SEM_IMPRESSORA),
    }
  )

  useEffect(() => {
    buscarImpressorasPesagem({})
    buscarConfigPesagem({})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { execute, isExecuting } = useAction(criarImpressoraAction, {
    onSuccess: ({ data }) => {
      if (!data) return
      toast.success('Impressora cadastrada')
      if (tipo === 'comanda') {
        onCriada(data)
      } else {
        setImpressorasPesagem((atual) => [...atual, data])
      }
      setNome('')
      setIdentificadorQz('')
    },
    onError: () => toast.error('Não foi possível cadastrar a impressora'),
  })

  const { execute: salvarConfigPesagem, isExecuting: salvandoConfigPesagem } =
    useAction(salvarConfiguracaoPesagemAction, {
      onSuccess: () => toast.success('Impressora de pesagem salva'),
      onError: () => toast.error('Não foi possível salvar'),
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Nome</Label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Elgin i9 — Caixa"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Tipo</Label>
            <Select
              value={tipo}
              onValueChange={(v) => setTipo(v as TipoImpressora)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="comanda">Comanda</SelectItem>
                <SelectItem value="pesagem">Pesagem</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
          onClick={() => execute({ nome, identificadorQz, tipo })}
        >
          {isExecuting ? 'Salvando...' : 'Salvar impressora'}
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-sm">Impressoras de comanda cadastradas</Label>
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

      <div className="flex flex-col gap-2">
        <Label className="text-sm">Impressora de pesagem</Label>
        <p className="text-xs text-muted-foreground">
          Usada pelo botão &quot;Imprimir pesagem&quot; nas empresas com fluxo
          de pesagem (ex: NOVAPRINT2) — impressora separada da de comanda.
        </p>
        {impressorasPesagem.length === 0 ? (
          <EmptyState message="Nenhuma impressora de pesagem cadastrada ainda." />
        ) : (
          <div className="flex items-center gap-2">
            <Select
              value={impressoraPesagemId}
              onValueChange={(v) => setImpressoraPesagemId(v)}
            >
              <SelectTrigger className="w-full sm:max-w-72">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SEM_IMPRESSORA}>Nenhuma</SelectItem>
                {impressorasPesagem.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              disabled={salvandoConfigPesagem}
              onClick={() =>
                salvarConfigPesagem({
                  impressoraId:
                    impressoraPesagemId === SEM_IMPRESSORA
                      ? null
                      : impressoraPesagemId,
                })
              }
            >
              Salvar
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
