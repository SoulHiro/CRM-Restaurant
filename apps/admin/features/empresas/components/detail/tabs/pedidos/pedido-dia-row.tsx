'use client'

import { useState } from 'react'
import { CircleDollarSign, Pencil, Printer, Trash2, UserX } from 'lucide-react'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@repo/ui/components/alert-dialog'
import { Badge } from '@repo/ui/components/badge'
import { Button } from '@repo/ui/components/button'
import { Input } from '@repo/ui/components/input'
import { Label } from '@repo/ui/components/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@repo/ui/components/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select'
import { cn } from '@repo/ui/lib/utils'

import { formatCurrencyBRL } from '@/lib/formatters'
import {
  atualizarPedidoAction,
  atualizarPrecoPedidoAction,
  marcarRecusaAction,
  removerPedidoAction,
} from '../../../../lib/actions'
import type { PedidoDoDiaItem } from '../../../../lib/types'

const TURNO_LABEL: Record<'almoco' | 'jantar', string> = {
  almoco: 'Almoço',
  jantar: 'Jantar',
}

const SEM_TURNO = '__sem_turno__'
const SEM_TAMANHO = '__sem_tamanho__'

type StatusImpressao = 'novo' | 'atualizado' | 'impresso'

/**
 * Nunca gravado — sempre comparado na hora: `impresso_em` só avança quando
 * a impressão de verdade termina (`marcarPedidosImpressosAction`);
 * `importado_em` avança em toda reimportação que mude a linha. Se o pedido
 * mudou depois da última impressão, precisa reimprimir.
 */
function statusImpressao(pedido: PedidoDoDiaItem): StatusImpressao {
  if (!pedido.impressoEm) return 'novo'
  if (new Date(pedido.importadoEm) > new Date(pedido.impressoEm)) {
    return 'atualizado'
  }
  return 'impresso'
}

const STATUS_IMPRESSAO_LABEL: Record<StatusImpressao, string> = {
  novo: 'Novo',
  atualizado: 'Atualizado',
  impresso: 'Impresso',
}

export function PedidoDiaRow({
  pedido,
  data,
  onImprimir,
  onRemovido,
}: {
  pedido: PedidoDoDiaItem
  data: string
  onImprimir: () => void
  onRemovido: () => void
}) {
  const status = statusImpressao(pedido)

  const [precoAberto, setPrecoAberto] = useState(false)
  const [precoInput, setPrecoInput] = useState(String(pedido.preco ?? ''))

  const [editarAberto, setEditarAberto] = useState(false)
  const [pratoInput, setPratoInput] = useState(pedido.prato ?? '')
  const [turnoInput, setTurnoInput] = useState(pedido.turno ?? SEM_TURNO)
  const [tamanhoInput, setTamanhoInput] = useState(pedido.tamanho ?? SEM_TAMANHO)
  const [observacaoInput, setObservacaoInput] = useState(pedido.observacao ?? '')

  const { execute, isExecuting } = useAction(removerPedidoAction, {
    onSuccess: () => {
      toast.success('Pedido removido')
      onRemovido()
    },
    onError: () => toast.error('Não foi possível remover o pedido'),
  })

  const { execute: marcarRecusa, isExecuting: marcandoRecusa } = useAction(
    marcarRecusaAction,
    {
      onSuccess: ({ input }) => {
        toast.success(
          input.recusou ? 'Marcado como "não vai comer hoje"' : 'Pedido reativado'
        )
        onRemovido()
      },
      onError: () => toast.error('Não foi possível atualizar o pedido'),
    }
  )

  const { execute: salvarPreco, isExecuting: salvandoPreco } = useAction(
    atualizarPrecoPedidoAction,
    {
      onSuccess: () => {
        toast.success('Valor do pedido atualizado')
        setPrecoAberto(false)
        onRemovido()
      },
      onError: () => toast.error('Não foi possível atualizar o valor'),
    }
  )

  function confirmarPreco(valor: number | null) {
    salvarPreco({ colaboradorId: pedido.colaboradorId, data, preco: valor })
  }

  const { execute: salvarPedido, isExecuting: salvandoPedido } = useAction(
    atualizarPedidoAction,
    {
      onSuccess: () => {
        toast.success('Pedido atualizado')
        setEditarAberto(false)
        onRemovido()
      },
      onError: () => toast.error('Não foi possível atualizar o pedido'),
    }
  )

  function confirmarEdicao() {
    if (!pratoInput.trim()) return
    salvarPedido({
      colaboradorId: pedido.colaboradorId,
      data,
      prato: pratoInput.trim(),
      turno:
        pedido.tipo === 'lanche' || turnoInput === SEM_TURNO
          ? null
          : (turnoInput as 'almoco' | 'jantar'),
      tamanho:
        pedido.tipo === 'lanche' || tamanhoInput === SEM_TAMANHO
          ? null
          : (tamanhoInput as 'P' | 'M' | 'G'),
      observacao: observacaoInput.trim() || null,
    })
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-lg bg-card p-4 sm:flex-row sm:items-center sm:justify-between',
        pedido.recusou && 'opacity-60'
      )}
    >
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-medium">{pedido.nome}</span>
        <span className="truncate text-sm text-muted-foreground">
          {pedido.recusou ? 'Não vai comer hoje' : pedido.prato}
          {pedido.tamanho && !pedido.recusou ? ` · ${pedido.tamanho}` : ''}
        </span>
        {pedido.observacao && (
          <span className="truncate text-xs text-muted-foreground">
            Obs: {pedido.observacao}
          </span>
        )}
        {pedido.preco != null && (
          <span className="truncate text-xs text-muted-foreground">
            Valor: {formatCurrencyBRL(pedido.preco)}
            {pedido.tipo === 'marmita' &&
              (pedido.preco === 0 ? ' (não contabiliza)' : ' (personalizado)')}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {!pedido.recusou && (
          <Badge
            variant={
              status === 'atualizado'
                ? 'destructive'
                : status === 'novo'
                  ? 'default'
                  : 'secondary'
            }
          >
            {STATUS_IMPRESSAO_LABEL[status]}
          </Badge>
        )}
        {pedido.turno && (
          <Badge variant="secondary" className="font-semibold">
            {TURNO_LABEL[pedido.turno]}
          </Badge>
        )}

        <Popover
          open={editarAberto}
          onOpenChange={(open) => {
            setEditarAberto(open)
            if (open) {
              setPratoInput(pedido.prato ?? '')
              setTurnoInput(pedido.turno ?? SEM_TURNO)
              setTamanhoInput(pedido.tamanho ?? SEM_TAMANHO)
              setObservacaoInput(pedido.observacao ?? '')
            }
          }}
        >
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Editar pedido de ${pedido.nome}`}
              disabled={pedido.recusou}
            >
              <Pencil className="size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72" align="end">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">
                  {pedido.tipo === 'lanche' ? 'Nome do lanche' : 'Prato'}
                </Label>
                <Input
                  value={pratoInput}
                  onChange={(e) => setPratoInput(e.target.value)}
                />
              </div>

              {pedido.tipo === 'marmita' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-sm">Turno</Label>
                    <Select value={turnoInput} onValueChange={setTurnoInput}>
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
                    <Select
                      value={tamanhoInput}
                      onValueChange={setTamanhoInput}
                    >
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

              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Observação</Label>
                <Input
                  value={observacaoInput}
                  onChange={(e) => setObservacaoInput(e.target.value)}
                  placeholder="Ex: sem cebola"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  size="sm"
                  disabled={salvandoPedido || !pratoInput.trim()}
                  onClick={confirmarEdicao}
                >
                  Salvar
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Popover
          open={precoAberto}
          onOpenChange={(open) => {
            setPrecoAberto(open)
            if (open) setPrecoInput(String(pedido.preco ?? ''))
          }}
        >
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Editar valor do pedido de ${pedido.nome}`}
              disabled={pedido.recusou}
            >
              <CircleDollarSign
                className={cn(
                  'size-4',
                  pedido.preco != null && 'text-primary'
                )}
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="end">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Valor deste pedido (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Padrão do tamanho"
                  value={precoInput}
                  onChange={(e) => setPrecoInput(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                O pedido continua contando normalmente no resumo do dia — só
                o valor cobrado muda.
              </p>
              <div className="flex justify-end gap-2">
                {pedido.tipo === 'marmita' && pedido.preco != null && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={salvandoPreco}
                    onClick={() => confirmarPreco(null)}
                  >
                    Usar padrão
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={salvandoPreco}
                  onClick={() => confirmarPreco(0)}
                >
                  Grátis
                </Button>
                <Button
                  size="sm"
                  disabled={salvandoPreco || precoInput.trim() === ''}
                  onClick={() => confirmarPreco(Number(precoInput) || 0)}
                >
                  Salvar
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button
          variant="ghost"
          size="icon"
          aria-label={
            pedido.recusou
              ? `Reativar pedido de ${pedido.nome}`
              : `Marcar ${pedido.nome} como "não vai comer hoje"`
          }
          disabled={marcandoRecusa}
          onClick={() =>
            marcarRecusa({
              colaboradorId: pedido.colaboradorId,
              data,
              recusou: !pedido.recusou,
            })
          }
        >
          <UserX className={cn('size-4', pedido.recusou && 'text-destructive')} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Imprimir comanda de ${pedido.nome}`}
          disabled={pedido.recusou}
          onClick={onImprimir}
        >
          <Printer className="size-4" />
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Remover pedido de ${pedido.nome}`}
              disabled={isExecuting}
            >
              <Trash2 className="size-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover pedido?</AlertDialogTitle>
              <AlertDialogDescription>
                O pedido de {pedido.nome} pra esse dia será removido. O
                colaborador continua cadastrado — só o pedido some. Essa ação
                não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  execute({ colaboradorId: pedido.colaboradorId, data })
                }
              >
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
