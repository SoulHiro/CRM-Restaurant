'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAction } from 'next-safe-action/hooks'
import { CheckCircle2, ClipboardCheck } from 'lucide-react'
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

import { formatDateBR } from '@/lib/formatters'
import { obterConfiguracaoResumoDiaAction } from '@/features/configuracoes/lib/actions'
import {
  finalizarDiaAction,
  obterFechamentoDoDiaAction,
  obterImpressoraComandaAction,
} from '../../../../lib/actions'
import type { PedidoDoDiaItem } from '../../../../lib/types'

export function FinalizarDiaDrawer({
  empresaId,
  empresaNome,
  data,
  pedidos,
}: {
  empresaId: string
  empresaNome: string
  data: string
  pedidos: PedidoDoDiaItem[]
}) {
  const [open, setOpen] = useState(false)
  const [jaFinalizado, setJaFinalizado] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [concluido, setConcluido] = useState(false)

  const [nomeEstabelecimento, setNomeEstabelecimento] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [identificadorImpressora, setIdentificadorImpressora] = useState<
    string | null
  >(null)

  const [quantidadeCafe, setQuantidadeCafe] = useState('0')
  const [precoCafe, setPrecoCafe] = useState('0')
  const [quantidadeSuco, setQuantidadeSuco] = useState('0')
  const [precoSuco, setPrecoSuco] = useState('0')
  const [quantidadeLanche, setQuantidadeLanche] = useState('0')
  const [precoLanche, setPrecoLanche] = useState('0')

  const contagem = useMemo(() => {
    let p = 0
    let m = 0
    let g = 0
    for (const pedido of pedidos) {
      if (!pedido.tamanho || pedido.recusou) continue
      if (pedido.tamanho === 'P') p++
      else if (pedido.tamanho === 'M') m++
      else if (pedido.tamanho === 'G') g++
    }
    return { p, m, g }
  }, [pedidos])

  const { execute: buscarFechamento } = useAction(obterFechamentoDoDiaAction, {
    onSuccess: ({ data: resultado }) =>
      setJaFinalizado(resultado?.fechamento != null),
  })
  const { execute: buscarConfigResumo } = useAction(
    obterConfiguracaoResumoDiaAction,
    {
      onSuccess: ({ data: resultado }) => {
        if (!resultado) return
        setNomeEstabelecimento(resultado.nomeEstabelecimento)
        setCnpj(resultado.cnpj)
        setPrecoCafe(String(resultado.precoCafe))
        setPrecoSuco(String(resultado.precoSuco))
        setPrecoLanche(String(resultado.precoLanche))
      },
    }
  )
  const { execute: buscarImpressora } = useAction(obterImpressoraComandaAction, {
    onSuccess: ({ data: resultado }) =>
      setIdentificadorImpressora(resultado?.impressora?.identificadorQz ?? null),
  })

  useEffect(() => {
    if (!open) return
    setCarregando(true)
    setConcluido(false)
    Promise.all([
      buscarFechamento({ empresaId, data }),
      buscarConfigResumo({}),
      buscarImpressora({}),
    ]).finally(() => setCarregando(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, empresaId, data])

  const { execute, isExecuting } = useAction(finalizarDiaAction, {
    onSuccess: async ({ data: resultado }) => {
      if (!resultado) return
      toast.success('Dia finalizado')
      await imprimir(resultado)
      setConcluido(true)
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? 'Não foi possível finalizar o dia')
    },
  })

  async function imprimir(contagemFinal: {
    quantidadeP: number
    quantidadeM: number
    quantidadeG: number
  }) {
    if (!identificadorImpressora) {
      toast.error(
        'Nenhuma impressora configurada — o fechamento foi salvo, mas não impresso.'
      )
      return
    }

    try {
      const [{ pdf }, { ResumoDiaPDF }, { imprimirComandasSequencial }] =
        await Promise.all([
          import('@react-pdf/renderer'),
          import('../../../../lib/resumo-dia-pdf'),
          import('@/lib/qz-print'),
        ])

      const blob = await pdf(
        <ResumoDiaPDF
          dados={{
            nomeEstabelecimento: nomeEstabelecimento || 'Nosso Quintal',
            cnpj,
            empresaClienteNome: empresaNome,
            impressoEm: new Date().toISOString(),
            quantidadeP: contagemFinal.quantidadeP,
            quantidadeM: contagemFinal.quantidadeM,
            quantidadeG: contagemFinal.quantidadeG,
            quantidadeCafe: Number(quantidadeCafe) || 0,
            quantidadeSuco: Number(quantidadeSuco) || 0,
            quantidadeLanche: Number(quantidadeLanche) || 0,
          }}
        />
      ).toBlob()

      await imprimirComandasSequencial(identificadorImpressora, [blob])
    } catch {
      toast.error(
        'Fechamento salvo, mas não foi possível imprimir. Confira o QZ Tray.'
      )
    }
  }

  return (
    <Drawer direction="right" open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button size="sm" variant="outline">
          <ClipboardCheck className="size-4" />
          Finalizar dia
        </Button>
      </DrawerTrigger>
      <DrawerContent
        direction="right"
        variant="float"
        className="flex w-full flex-col gap-0 sm:max-w-md"
      >
        <DrawerHeader>
          <DrawerTitle>Finalizar dia — {formatDateBR(data)}</DrawerTitle>
          <DrawerDescription>{empresaNome}</DrawerDescription>
        </DrawerHeader>

        {carregando ? (
          <div className="flex-1 px-4 py-6 text-sm text-muted-foreground">
            Carregando...
          </div>
        ) : concluido ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-12 text-center">
            <CheckCircle2 className="size-10 text-sidebar" />
            <p className="font-medium">Dia finalizado</p>
            <p className="text-sm text-muted-foreground">
              A nota foi enviada pra impressão.
            </p>
            <Button onClick={() => setOpen(false)}>Fechar</Button>
          </div>
        ) : jaFinalizado ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-12 text-center">
            <p className="font-medium">Esse dia já foi finalizado</p>
            <p className="text-sm text-muted-foreground">
              {empresaNome} em {formatDateBR(data)} já tem um fechamento
              registrado.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-6">
              <div className="flex justify-between rounded-lg border p-3 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">P</p>
                  <p className="text-2xl font-bold">{contagem.p}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">M</p>
                  <p className="text-2xl font-bold">{contagem.m}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">G</p>
                  <p className="text-2xl font-bold">{contagem.g}</p>
                </div>
              </div>

              {[
                {
                  label: 'Café',
                  qtd: quantidadeCafe,
                  setQtd: setQuantidadeCafe,
                  preco: precoCafe,
                  setPreco: setPrecoCafe,
                },
                {
                  label: 'Suco',
                  qtd: quantidadeSuco,
                  setQtd: setQuantidadeSuco,
                  preco: precoSuco,
                  setPreco: setPrecoSuco,
                },
                {
                  label: 'Lanche',
                  qtd: quantidadeLanche,
                  setQtd: setQuantidadeLanche,
                  preco: precoLanche,
                  setPreco: setPrecoLanche,
                },
              ].map((item) => (
                <div key={item.label} className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-sm">{item.label} — quantidade</Label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={item.qtd}
                      onChange={(e) => item.setQtd(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-sm">Valor unitário (R$)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.preco}
                      onChange={(e) => item.setPreco(e.target.value)}
                    />
                  </div>
                </div>
              ))}
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
                disabled={isExecuting}
                onClick={() =>
                  execute({
                    empresaId,
                    data,
                    quantidadeCafe: Number(quantidadeCafe) || 0,
                    precoUnitarioCafe: Number(precoCafe) || 0,
                    quantidadeSuco: Number(quantidadeSuco) || 0,
                    precoUnitarioSuco: Number(precoSuco) || 0,
                    quantidadeLanche: Number(quantidadeLanche) || 0,
                    precoUnitarioLanche: Number(precoLanche) || 0,
                  })
                }
              >
                {isExecuting ? 'Finalizando...' : 'Finalizar e imprimir'}
              </Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  )
}
