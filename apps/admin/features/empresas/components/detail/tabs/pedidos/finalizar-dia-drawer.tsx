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
  reabrirDiaAction,
} from '../../../../lib/actions'
import type {
  FechamentoDia,
  ItemFechamento,
  PedidoDoDiaItem,
} from '../../../../lib/types'
import type { ItemResumoDia, ResumoDiaDados } from '../../../../lib/resumo-dia-pdf'

export function FinalizarDiaDrawer({
  empresaId,
  empresaNome,
  data,
  pedidos,
  onFinalizado,
}: {
  empresaId: string
  empresaNome: string
  data: string
  pedidos: PedidoDoDiaItem[]
  onFinalizado: () => void
}) {
  const [open, setOpen] = useState(false)
  const [fechamento, setFechamento] = useState<FechamentoDia | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [concluido, setConcluido] = useState(false)
  const [reimprimindo, setReimprimindo] = useState(false)

  const [nomeEstabelecimento, setNomeEstabelecimento] = useState('')
  const [endereco, setEndereco] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [inscricaoEstadual, setInscricaoEstadual] = useState('')
  const [identificadorImpressora, setIdentificadorImpressora] = useState<
    string | null
  >(null)

  const [precoP, setPrecoP] = useState('0')
  const [precoM, setPrecoM] = useState('0')
  const [precoG, setPrecoG] = useState('0')
  const [quantidadeCafe, setQuantidadeCafe] = useState('0')
  const [precoCafe, setPrecoCafe] = useState('0')
  const [quantidadeSuco, setQuantidadeSuco] = useState('0')
  const [precoSuco, setPrecoSuco] = useState('0')
  const [quantidadeLanche, setQuantidadeLanche] = useState('0')
  const [precoLanche, setPrecoLanche] = useState('0')

  const pedidosValidos = useMemo(
    () => pedidos.filter((p) => p.tamanho != null && !p.recusou),
    [pedidos]
  )

  const contagem = useMemo(() => {
    let p = 0
    let m = 0
    let g = 0
    for (const pedido of pedidosValidos) {
      if (pedido.tamanho === 'P') p++
      else if (pedido.tamanho === 'M') m++
      else if (pedido.tamanho === 'G') g++
    }
    return { p, m, g }
  }, [pedidosValidos])

  const { executeAsync: buscarFechamento } = useAction(
    obterFechamentoDoDiaAction,
    {
      onError: () => toast.error('Não foi possível checar o fechamento do dia'),
    }
  )
  const { executeAsync: buscarConfigResumo } = useAction(
    obterConfiguracaoResumoDiaAction,
    {
      onError: () => toast.error('Não foi possível carregar a configuração'),
    }
  )
  const { executeAsync: buscarImpressora } = useAction(
    obterImpressoraComandaAction,
    {
      onError: () => toast.error('Não foi possível checar a impressora'),
    }
  )

  useEffect(() => {
    if (!open) return
    setCarregando(true)
    setConcluido(false)

    // `execute()` do next-safe-action não devolve promise de verdade — só
    // `executeAsync()` espera a resposta chegar. E `Promise.allSettled` (não
    // `Promise.all`) importa aqui: as três buscas são independentes — uma
    // falhar não pode impedir as outras duas de aplicar o resultado delas.
    Promise.allSettled([
      buscarFechamento({ empresaId, data }),
      buscarConfigResumo({}),
      buscarImpressora({}),
    ])
      .then(([resultadoFechamento, resultadoConfig, resultadoImpressora]) => {
        if (resultadoFechamento.status === 'fulfilled') {
          setFechamento(resultadoFechamento.value?.data?.fechamento ?? null)
        }

        if (
          resultadoConfig.status === 'fulfilled' &&
          resultadoConfig.value?.data
        ) {
          setNomeEstabelecimento(resultadoConfig.value.data.nomeEstabelecimento)
          setEndereco(resultadoConfig.value.data.endereco)
          setCnpj(resultadoConfig.value.data.cnpj)
          setInscricaoEstadual(resultadoConfig.value.data.inscricaoEstadual)
        }

        if (resultadoImpressora.status === 'fulfilled') {
          setIdentificadorImpressora(
            resultadoImpressora.value?.data?.impressora?.identificadorQz ??
              null
          )
        }
      })
      .finally(() => setCarregando(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, empresaId, data])

  const { execute: reabrir, isExecuting: reabrindo } = useAction(
    reabrirDiaAction,
    {
      onSuccess: () => {
        toast.success('Fechamento desfeito — ajuste os pedidos e finalize de novo')
        setFechamento(null)
      },
      onError: () => toast.error('Não foi possível reabrir o dia'),
    }
  )

  const { execute, isExecuting } = useAction(finalizarDiaAction, {
    onSuccess: async () => {
      toast.success('Dia finalizado')
      await imprimir(construirDadosDoFormulario())
      setConcluido(true)
      onFinalizado()
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? 'Não foi possível finalizar o dia')
    },
  })

  function construirDadosDoFormulario(): ResumoDiaDados {
    const itens: ItemResumoDia[] = pedidosValidos.map((pedido) => ({
      colaboradorNome: pedido.nome,
      prato: pedido.prato,
      tamanho: pedido.tamanho as 'P' | 'M' | 'G',
      preco:
        pedido.tamanho === 'P'
          ? Number(precoP) || 0
          : pedido.tamanho === 'M'
            ? Number(precoM) || 0
            : Number(precoG) || 0,
    }))

    return {
      nomeEstabelecimento: nomeEstabelecimento || 'Nosso Quintal',
      endereco,
      cnpj,
      inscricaoEstadual,
      empresaClienteNome: empresaNome,
      impressoEm: new Date().toISOString(),
      itens,
      quantidadeCafe: Number(quantidadeCafe) || 0,
      precoUnitarioCafe: Number(precoCafe) || 0,
      quantidadeSuco: Number(quantidadeSuco) || 0,
      precoUnitarioSuco: Number(precoSuco) || 0,
      quantidadeLanche: Number(quantidadeLanche) || 0,
      precoUnitarioLanche: Number(precoLanche) || 0,
    }
  }

  function construirDadosDoHistorico(registro: FechamentoDia): ResumoDiaDados {
    const itens: ItemResumoDia[] = registro.itens.map(
      (item: ItemFechamento) => ({
        colaboradorNome: item.colaboradorNome,
        prato: item.prato,
        tamanho: item.tamanho,
        preco: item.preco,
      })
    )

    return {
      nomeEstabelecimento: nomeEstabelecimento || 'Nosso Quintal',
      endereco,
      cnpj,
      inscricaoEstadual,
      empresaClienteNome: empresaNome,
      impressoEm: new Date().toISOString(),
      itens,
      quantidadeCafe: registro.quantidadeCafe,
      precoUnitarioCafe: registro.precoUnitarioCafe,
      quantidadeSuco: registro.quantidadeSuco,
      precoUnitarioSuco: registro.precoUnitarioSuco,
      quantidadeLanche: registro.quantidadeLanche,
      precoUnitarioLanche: registro.precoUnitarioLanche,
    }
  }

  async function imprimir(dados: ResumoDiaDados) {
    // Não confia só no estado carregado quando o drawer abriu — busca de
    // novo, na hora, se por algum motivo ainda estiver vazio. É o que
    // garante que a impressão funciona sempre que existe impressora
    // cadastrada, mesmo que a carga inicial tenha falhado silenciosamente.
    let identificador = identificadorImpressora
    if (!identificador) {
      const resultado = await buscarImpressora({})
      identificador = resultado?.data?.impressora?.identificadorQz ?? null
      if (identificador) setIdentificadorImpressora(identificador)
    }

    if (!identificador) {
      toast.error(
        'Nenhuma impressora configurada — o fechamento foi salvo, mas não impresso.'
      )
      return
    }

    try {
      const [{ pdf }, { ResumoDiaPDF }, { imprimirDocumentoUnico }] =
        await Promise.all([
          import('@react-pdf/renderer'),
          import('../../../../lib/resumo-dia-pdf'),
          import('@/lib/qz-print'),
        ])

      const blob = await pdf(<ResumoDiaPDF dados={dados} />).toBlob()

      await imprimirDocumentoUnico(identificador, blob)
    } catch {
      toast.error(
        'Fechamento salvo, mas não foi possível imprimir. Confira o QZ Tray.'
      )
    }
  }

  async function reimprimir() {
    if (!fechamento) return
    setReimprimindo(true)
    try {
      await imprimir(construirDadosDoHistorico(fechamento))
    } finally {
      setReimprimindo(false)
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
        ) : fechamento ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-12 text-center">
            <p className="font-medium">Esse dia já foi finalizado</p>
            <p className="text-sm text-muted-foreground">
              {empresaNome} em {formatDateBR(data)} já tem um fechamento
              registrado. Reabrir apaga esse fechamento — ajuste os pedidos e
              finalize de novo.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={reimprimindo}
                onClick={reimprimir}
              >
                {reimprimindo ? 'Reimprimindo...' : 'Reimprimir'}
              </Button>
              <Button
                variant="outline"
                disabled={reabrindo}
                onClick={() => reabrir({ empresaId, data })}
              >
                {reabrindo ? 'Reabrindo...' : 'Reabrir dia'}
              </Button>
            </div>
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
                { label: 'Marmita P', preco: precoP, setPreco: setPrecoP },
                { label: 'Marmita M', preco: precoM, setPreco: setPrecoM },
                { label: 'Marmita G', preco: precoG, setPreco: setPrecoG },
              ].map((item) => (
                <div key={item.label} className="flex flex-col gap-1.5">
                  <Label className="text-sm">
                    {item.label} — valor unitário (R$)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.preco}
                    onChange={(e) => item.setPreco(e.target.value)}
                  />
                </div>
              ))}

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
                    precoUnitarioP: Number(precoP) || 0,
                    precoUnitarioM: Number(precoM) || 0,
                    precoUnitarioG: Number(precoG) || 0,
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
