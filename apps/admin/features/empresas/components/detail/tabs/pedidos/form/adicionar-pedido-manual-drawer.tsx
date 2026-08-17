'use client'

import { useEffect, useState } from 'react'
import { useAction } from 'next-safe-action/hooks'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@repo/ui/components/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@repo/ui/components/drawer'
import { Input } from '@repo/ui/components/input'
import { Label } from '@repo/ui/components/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select'

import {
  importarPedidosAction,
  listarColaboradoresAction,
} from '../../../../../lib/actions'

const NOVO = '__novo__'
const SEM_TURNO = '__sem_turno__'
const SEM_TAMANHO = '__sem_tamanho__'

export function AdicionarPedidoManualDrawer({
  empresaId,
  data,
  onAdicionado,
}: {
  empresaId: string
  data: string
  onAdicionado: () => void
}) {
  const [open, setOpen] = useState(false)
  const [colaboradores, setColaboradores] = useState<
    { id: string; nome: string }[]
  >([])
  const [colaboradorId, setColaboradorId] = useState(NOVO)
  const [nomeNovo, setNomeNovo] = useState('')
  const [turno, setTurno] = useState(SEM_TURNO)
  const [tamanho, setTamanho] = useState(SEM_TAMANHO)
  const [prato, setPrato] = useState('')
  const [observacao, setObservacao] = useState('')

  const { execute: buscarColaboradores } = useAction(listarColaboradoresAction, {
    onSuccess: ({ data: resultado }) =>
      setColaboradores(resultado?.colaboradores ?? []),
  })

  useEffect(() => {
    if (open) buscarColaboradores({ empresaId })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function limpar() {
    setColaboradorId(NOVO)
    setNomeNovo('')
    setTurno(SEM_TURNO)
    setTamanho(SEM_TAMANHO)
    setPrato('')
    setObservacao('')
  }

  const { execute, isExecuting } = useAction(importarPedidosAction, {
    onSuccess: () => {
      toast.success('Pedido adicionado')
      setOpen(false)
      limpar()
      onAdicionado()
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? 'Não foi possível adicionar o pedido')
    },
  })

  const nomeSelecionado =
    colaboradorId === NOVO
      ? nomeNovo.trim()
      : (colaboradores.find((c) => c.id === colaboradorId)?.nome ?? '')

  function confirmar() {
    if (!nomeSelecionado || !prato.trim()) return

    execute({
      empresaId,
      arquivoOrigem: 'manual',
      itens: [
        {
          nome: nomeSelecionado,
          colaboradorId: colaboradorId === NOVO ? null : colaboradorId,
          whatsapp: null,
          data,
          turno: turno === SEM_TURNO ? null : (turno as 'almoco' | 'jantar'),
          tamanho:
            tamanho === SEM_TAMANHO ? null : (tamanho as 'P' | 'M' | 'G'),
          prato: prato.trim(),
          observacao: observacao.trim() || null,
          respondidoEm: null,
        },
      ],
    })
  }

  return (
    <Drawer
      direction="right"
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) limpar()
      }}
    >
      <DrawerTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="size-4" />
          Adicionar pedido
        </Button>
      </DrawerTrigger>
      <DrawerContent
        direction="right"
        variant="float"
        className="flex w-full flex-col gap-0 sm:max-w-md"
      >
        <DrawerHeader>
          <DrawerTitle>Adicionar pedido manual</DrawerTitle>
          <DrawerDescription>
            Pra quem não veio na planilha ou precisa de um ajuste pontual.
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-6">
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Colaborador</Label>
            <Select value={colaboradorId} onValueChange={setColaboradorId}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NOVO}>Novo colaborador</SelectItem>
                {colaboradores.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {colaboradorId === NOVO && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Nome</Label>
              <Input
                value={nomeNovo}
                onChange={(e) => setNomeNovo(e.target.value)}
                placeholder="Nome completo"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Turno</Label>
              <Select value={turno} onValueChange={setTurno}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SEM_TURNO}>—</SelectItem>
                  <SelectItem value="almoco">Almoço</SelectItem>
                  <SelectItem value="jantar">Jantar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Tamanho</Label>
              <Select value={tamanho} onValueChange={setTamanho}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SEM_TAMANHO}>—</SelectItem>
                  <SelectItem value="P">Pequena</SelectItem>
                  <SelectItem value="M">Média</SelectItem>
                  <SelectItem value="G">Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Prato</Label>
            <Input
              value={prato}
              onChange={(e) => setPrato(e.target.value)}
              placeholder="Ex: Frango grelhado"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Observação (opcional)</Label>
            <Input
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex: sem cebola"
            />
          </div>
        </div>

        <DrawerFooter className="flex-row justify-end gap-2 border-t">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isExecuting}
          >
            Cancelar
          </Button>
          <Button
            onClick={confirmar}
            disabled={isExecuting || !nomeSelecionado || !prato.trim()}
          >
            {isExecuting ? 'Adicionando...' : 'Adicionar'}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
