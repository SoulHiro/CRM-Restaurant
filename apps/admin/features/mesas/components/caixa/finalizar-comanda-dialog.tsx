'use client'

import { useState } from 'react'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'

import { Button } from '@repo/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/dialog'
import { Input } from '@repo/ui/components/input'
import { Label } from '@repo/ui/components/label'
import { Separator } from '@repo/ui/components/separator'

import { useImprimirComprovante } from '../../hooks/use-imprimir-comprovante'
import { marcarNotaPendenteAction, registrarPagamentoAction } from '../../lib/actions'
import {
  centavosParaReais,
  dividirCentavosIgualmente,
  formatarCentavosBRL,
  parseReaisParaCentavos,
  somarCentavos,
} from '../../lib/dinheiro'
import type { ComandaView } from '../../lib/types'
import { LinhaPagamentoInput, type LinhaPagamento } from './linha-pagamento-input'

type Etapa =
  | { nome: 'pagamento' }
  | { nome: 'fechada'; trocoCentavos: number }

export function FinalizarComandaDialog({
  comanda,
  organizationName,
  open,
  onOpenChange,
}: {
  comanda: ComandaView
  organizationName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [linhas, setLinhas] = useState<LinhaPagamento[]>([
    { forma: 'dinheiro', valorReais: centavosParaReais(comanda.saldoDevidoCentavos).toFixed(2) },
  ])
  const [etapa, setEtapa] = useState<Etapa>({ nome: 'pagamento' })
  const [email, setEmail] = useState('')

  const { imprimirComprovante, dialog: dialogImpressora } = useImprimirComprovante()

  const { execute: pagar, isPending: pagando } = useAction(registrarPagamentoAction, {
    onSuccess: ({ data }) => {
      if (!data) return
      if (data.fechada) {
        setEtapa({ nome: 'fechada', trocoCentavos: data.trocoCentavos })
      } else {
        toast.info(
          `Pagamento parcial registrado. Falta ${formatarCentavosBRL(data.saldoDevidoCentavos)}.`
        )
        fechar()
      }
    },
    onError: ({ error }) =>
      toast.error(error.serverError ?? 'Não foi possível registrar o pagamento.'),
  })

  const { execute: marcarNota, isPending: marcandoNota } = useAction(
    marcarNotaPendenteAction,
    {
      onSuccess: () => toast.success('Marcado — não esqueça de emitir depois.'),
      onError: ({ error }) => toast.error(error.serverError ?? 'Não foi possível marcar.'),
    }
  )

  function fechar() {
    onOpenChange(false)
    setEtapa({ nome: 'pagamento' })
    setLinhas([
      { forma: 'dinheiro', valorReais: centavosParaReais(comanda.saldoDevidoCentavos).toFixed(2) },
    ])
    setEmail('')
  }

  const somaLancadaCentavos = somarCentavos(
    linhas.map((l) => parseReaisParaCentavos(l.valorReais))
  )
  const restanteCentavos = comanda.saldoDevidoCentavos - somaLancadaCentavos

  function dividirPorPessoas() {
    const texto = window.prompt('Dividir em quantas partes?')
    const n = Number(texto)
    if (!Number.isInteger(n) || n <= 0) return
    const partes = dividirCentavosIgualmente(comanda.saldoDevidoCentavos, n)
    setLinhas(partes.map((centavos) => ({ forma: 'dinheiro', valorReais: centavosParaReais(centavos).toFixed(2) })))
  }

  async function imprimir() {
    await imprimirComprovante({
      nomeEstabelecimento: organizationName,
      numero: comanda.numero,
      mesaLabel: comanda.mesaLabel,
      itens: comanda.itens.map((i) => ({
        quantidade: i.quantidade,
        produtoNome: i.produtoNome,
        totalCentavos: i.totalCentavos,
      })),
      totalCentavos: comanda.totalCentavos,
      pagamentos: linhas.map((l) => ({
        forma: l.forma,
        valorCentavos: parseReaisParaCentavos(l.valorReais),
      })),
      trocoCentavos: etapa.nome === 'fechada' ? etapa.trocoCentavos : 0,
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(o) : fechar())}>
      <DialogContent>
        {etapa.nome === 'pagamento' && (
          <>
            <DialogHeader>
              <DialogTitle>Finalizar comanda #{comanda.numero}</DialogTitle>
              <DialogDescription>
                Total {formatarCentavosBRL(comanda.totalCentavos)}
                {comanda.pagoCentavos > 0 &&
                  ` — já pago ${formatarCentavosBRL(comanda.pagoCentavos)}`}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-2">
              {linhas.map((linha, i) => (
                <LinhaPagamentoInput
                  key={i}
                  linha={linha}
                  removivel={linhas.length > 1}
                  onChange={(nova) =>
                    setLinhas((atual) => atual.map((l, idx) => (idx === i ? nova : l)))
                  }
                  onRemover={() =>
                    setLinhas((atual) => atual.filter((_, idx) => idx !== i))
                  }
                />
              ))}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setLinhas((atual) => [...atual, { forma: 'dinheiro', valorReais: '' }])
                  }
                >
                  + forma
                </Button>
                <Button variant="outline" size="sm" onClick={dividirPorPessoas}>
                  Dividir por N
                </Button>
              </div>

              <Separator />

              <p className="text-sm font-medium">
                {restanteCentavos > 0
                  ? `Falta ${formatarCentavosBRL(restanteCentavos)}`
                  : restanteCentavos < 0
                    ? `Troco ${formatarCentavosBRL(-restanteCentavos)} (se em dinheiro)`
                    : 'Valor bate certinho'}
              </p>
            </div>

            <DialogFooter>
              <Button
                disabled={pagando || somaLancadaCentavos <= 0}
                onClick={() =>
                  pagar({
                    comandaId: comanda.id,
                    pagamentos: linhas
                      .map((l) => ({
                        forma: l.forma,
                        valorCentavos: parseReaisParaCentavos(l.valorReais),
                      }))
                      .filter((l) => l.valorCentavos > 0),
                  })
                }
              >
                {pagando ? 'Registrando...' : 'Confirmar pagamento'}
              </Button>
            </DialogFooter>
          </>
        )}

        {etapa.nome === 'fechada' && (
          <>
            <DialogHeader>
              <DialogTitle>Comanda #{comanda.numero} fechada</DialogTitle>
              <DialogDescription>
                {etapa.trocoCentavos > 0
                  ? `Troco: ${formatarCentavosBRL(etapa.trocoCentavos)}`
                  : 'Pagamento completo.'}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3">
              <Button variant="outline" onClick={imprimir}>
                Imprimir comprovante
              </Button>

              <Separator />

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="nota-email">Cliente pediu nota fiscal? E-mail:</Label>
                <div className="flex gap-2">
                  <Input
                    id="nota-email"
                    type="email"
                    placeholder="cliente@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    disabled={!email || marcandoNota}
                    onClick={() => marcarNota({ comandaId: comanda.id, email })}
                  >
                    Marcar
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={fechar}>Concluir</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>

      {dialogImpressora}
    </Dialog>
  )
}
