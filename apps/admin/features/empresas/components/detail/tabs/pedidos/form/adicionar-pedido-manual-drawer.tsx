'use client'

import { useEffect, useState } from 'react'
import { useAction } from 'next-safe-action/hooks'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@repo/ui/components/button'
import { Checkbox } from '@repo/ui/components/checkbox'
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
  marcarPedidosImpressosAction,
  obterPrecosEmpresaAction,
} from '../../../../../lib/actions'
import {
  useImprimirComandas,
  type ComandaEntrada,
} from '../../../../../hooks/use-imprimir-comandas'
import type { PedidoDoDiaItem } from '../../../../../lib/types'
import {
  ColaboradorCombobox,
  type ColaboradorOption,
} from './colaborador-combobox'

const SEM_TURNO = '__sem_turno__'
const SEM_TAMANHO = '__sem_tamanho__'

type TipoPedido = 'marmita' | 'lanche'

/** Prato mais frequente entre os pedidos de marmita já lançados hoje — na prática, o prato do dia. */
function pratoDoDia(pedidosHoje: PedidoDoDiaItem[]): string | null {
  const contagem = new Map<string, number>()
  for (const pedido of pedidosHoje) {
    if (pedido.tipo !== 'marmita' || !pedido.prato || pedido.recusou) continue
    contagem.set(pedido.prato, (contagem.get(pedido.prato) ?? 0) + 1)
  }
  let melhor: string | null = null
  let maior = 0
  for (const [prato, quantidade] of contagem) {
    if (quantidade > maior) {
      maior = quantidade
      melhor = prato
    }
  }
  return melhor
}

export function AdicionarPedidoManualDrawer({
  empresaId,
  empresaNome,
  data,
  pedidosHoje,
  onAdicionado,
}: {
  empresaId: string
  empresaNome: string
  data: string
  pedidosHoje: PedidoDoDiaItem[]
  onAdicionado: () => void
}) {
  const [open, setOpen] = useState(false)
  const [colaboradores, setColaboradores] = useState<ColaboradorOption[]>([])
  const [busca, setBusca] = useState('')
  const [colaboradorSelecionado, setColaboradorSelecionado] =
    useState<ColaboradorOption | null>(null)
  const [criandoNovo, setCriandoNovo] = useState(false)
  const [visitante, setVisitante] = useState(false)
  const [tipo, setTipo] = useState<TipoPedido>('marmita')
  const [turno, setTurno] = useState(SEM_TURNO)
  const [tamanho, setTamanho] = useState(SEM_TAMANHO)
  const [prato, setPrato] = useState('')
  const [preco, setPreco] = useState('0')
  const [observacao, setObservacao] = useState('')
  const [lanchePadrao, setLanchePadrao] = useState<{
    nome: string
    preco: number
  } | null>(null)
  const [imprimirAoCriar, setImprimirAoCriar] = useState(true)

  const { imprimir, imprimindo } = useImprimirComandas()
  const { executeAsync: marcarImpresso } = useAction(
    marcarPedidosImpressosAction
  )

  const { execute: buscarColaboradores } = useAction(
    listarColaboradoresAction,
    {
      onSuccess: ({ data: resultado }) =>
        setColaboradores(resultado?.colaboradores ?? []),
    }
  )
  const { execute: buscarPrecos } = useAction(obterPrecosEmpresaAction, {
    onSuccess: ({ data: resultado }) => {
      const lanche = resultado?.precos?.lanche
      if (lanche) setLanchePadrao({ nome: lanche.nome, preco: lanche.preco })
    },
  })

  useEffect(() => {
    if (!open) return
    buscarColaboradores({ empresaId })
    buscarPrecos({ empresaId })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Muda o default do prato de acordo com o tipo: lanche usa sempre o nome
  // padrão cadastrado em Valores (sem input pra digitar); marmita sugere o
  // prato mais pedido hoje, mas sem sobrescrever o que a pessoa já digitou.
  useEffect(() => {
    if (!open) return
    if (tipo === 'lanche') {
      setPrato(lanchePadrao?.nome ?? '')
      if (lanchePadrao) setPreco(String(lanchePadrao.preco))
    } else {
      setPrato((atual) => atual || pratoDoDia(pedidosHoje) || '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tipo, lanchePadrao])

  function limpar() {
    setBusca('')
    setColaboradorSelecionado(null)
    setCriandoNovo(false)
    setVisitante(false)
    setTipo('marmita')
    setTurno(SEM_TURNO)
    setTamanho(SEM_TAMANHO)
    setPrato('')
    setPreco('0')
    setObservacao('')
  }

  const { execute, isExecuting } = useAction(importarPedidosAction, {
    onSuccess: async ({ data: resultado }) => {
      toast.success('Pedido adicionado')

      const colaboradorId = resultado?.colaboradorIds?.[0]
      if (imprimirAoCriar && colaboradorId) {
        const comanda: ComandaEntrada = {
          nome: nomeSelecionado,
          empresaNome,
          turno:
            tipo === 'lanche' || turno === SEM_TURNO
              ? null
              : (turno as 'almoco' | 'jantar'),
          tamanho:
            tipo === 'lanche' || tamanho === SEM_TAMANHO
              ? null
              : (tamanho as 'P' | 'M' | 'G'),
          prato: prato.trim(),
          observacao: observacao.trim() || null,
          respondidoEm: null,
        }
        const sucesso = await imprimir([comanda])
        if (sucesso)
          await marcarImpresso({ colaboradorIds: [colaboradorId], data })
      }

      setOpen(false)
      limpar()
      onAdicionado()
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? 'Não foi possível adicionar o pedido')
    },
  })

  const nomeSelecionado =
    colaboradorSelecionado?.nome ?? (criandoNovo ? busca.trim() : '')

  function confirmar() {
    if (!nomeSelecionado || !prato.trim()) return

    execute({
      empresaId,
      arquivoOrigem: 'manual',
      itens: [
        {
          nome: nomeSelecionado,
          colaboradorId: colaboradorSelecionado?.id ?? null,
          colaboradorTipo: visitante ? 'visitante' : 'funcionario',
          whatsapp: null,
          data,
          tipo,
          turno:
            tipo === 'lanche' || turno === SEM_TURNO
              ? null
              : (turno as 'almoco' | 'jantar'),
          tamanho:
            tipo === 'lanche' || tamanho === SEM_TAMANHO
              ? null
              : (tamanho as 'P' | 'M' | 'G'),
          prato: prato.trim(),
          preco: tipo === 'lanche' ? Number(preco) || 0 : null,
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
      // Sem <Drawer.Handle /> nenhum, então isso desativa só o arrastar pra
      // fechar — clicar fora e Esc continuam funcionando, como um Sheet
      // normal fecharia (`dismissible={false}` desativaria os dois
      // também, o que não é o que queremos aqui).
      handleOnly
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
            <Label className="text-sm">Tipo</Label>
            <Select
              value={tipo}
              onValueChange={(v) => setTipo(v as TipoPedido)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="marmita">Marmita</SelectItem>
                <SelectItem value="lanche">Lanche</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Colaborador</Label>
            <ColaboradorCombobox
              colaboradores={colaboradores}
              busca={busca}
              onBuscaChange={(valor) => {
                setBusca(valor)
                setColaboradorSelecionado(null)
                setCriandoNovo(false)
              }}
              onSelecionar={(c) => {
                setColaboradorSelecionado(c)
                setBusca(c.nome)
                setCriandoNovo(false)
              }}
              onCriarNovo={(nome) => {
                setCriandoNovo(true)
                setBusca(nome)
              }}
            />
          </div>

          {criandoNovo && (
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={visitante}
                onCheckedChange={(v) => setVisitante(v === true)}
              />
              Visitante (não é funcionário da empresa)
            </label>
          )}

          {tipo === 'marmita' && (
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
          )}

          {tipo === 'lanche' ? (
            <p className="text-sm text-muted-foreground">
              Lanche:{' '}
              <span className="font-medium text-foreground">
                {prato || '—'}
              </span>
            </p>
          ) : (
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Prato</Label>
              <Input
                value={prato}
                onChange={(e) => setPrato(e.target.value)}
                placeholder="Ex: Frango grelhado"
              />
            </div>
          )}

          {tipo === 'lanche' && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">Preço (R$)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm">Observação (opcional)</Label>
            <Input
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex: sem cebola"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={imprimirAoCriar}
              onCheckedChange={(v) => setImprimirAoCriar(v === true)}
            />
            Imprimir a comanda automaticamente ao criar
          </label>
        </div>

        <DrawerFooter className="flex-row justify-end gap-2 border-t">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isExecuting || imprimindo}
          >
            Cancelar
          </Button>
          <Button
            onClick={confirmar}
            disabled={
              isExecuting || imprimindo || !nomeSelecionado || !prato.trim()
            }
          >
            {isExecuting || imprimindo ? 'Adicionando...' : 'Adicionar'}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
