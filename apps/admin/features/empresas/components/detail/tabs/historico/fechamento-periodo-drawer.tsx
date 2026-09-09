'use client'

import { useState } from 'react'
import { useAction } from 'next-safe-action/hooks'
import { Plus, Printer, Trash2 } from 'lucide-react'
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

import { formatCurrencyBRL, formatDateBR } from '@/lib/formatters'
import { obterConfiguracaoLayoutResumoAction } from '@/features/configuracoes/lib/actions'
import { CAMPOS_RESUMO_PADRAO } from '@/features/configuracoes/lib/types'
import { obterImpressoraComandaAction } from '../../../../lib/actions'
import type { EmpresaPrecoModo, FechamentoDia } from '../../../../lib/types'
import type { DateRangeValue } from '../../../shared/date-range-filter'

interface LinhaAcrescimo {
  id: string
  descricao: string
  valor: string
}

interface LinhaDiaAvulso {
  id: string
  data: string
  descricao: string
  valor: string
}

function novoId(): string {
  return Math.random().toString(36).slice(2)
}

function somaValida(linhas: { valor: string }[]): number {
  return linhas.reduce((soma, l) => soma + (Number(l.valor) || 0), 0)
}

/**
 * Fechamento de período — soma o que já foi finalizado dia a dia dentro do
 * intervalo selecionado no filtro do histórico, mais acréscimos e dias
 * avulsos lançados na hora (nunca gravados no banco, só entram no papel —
 * ver `fechamento-periodo-pdf.tsx`). Acréscimo não pertence a nenhum dia
 * específico, por isso soma só no total geral, nunca no subtotal dos dias.
 */
export function FechamentoPeriodoDrawer({
  empresaNome,
  fechamentosNoPeriodo,
  intervalo,
  resumoMostraQuantidades,
  precoModo,
  pedeCafe,
  pedeLanche,
  pedeSuco,
}: {
  empresaNome: string
  fechamentosNoPeriodo: FechamentoDia[]
  intervalo: DateRangeValue
  resumoMostraQuantidades: boolean
  precoModo: EmpresaPrecoModo
  pedeCafe: boolean
  pedeLanche: boolean
  pedeSuco: boolean
}) {
  const [open, setOpen] = useState(false)
  const [acrescimos, setAcrescimos] = useState<LinhaAcrescimo[]>([])
  const [diasAvulsos, setDiasAvulsos] = useState<LinhaDiaAvulso[]>([])
  const [imprimindo, setImprimindo] = useState(false)

  const { executeAsync: buscarLayout } = useAction(
    obterConfiguracaoLayoutResumoAction
  )
  const { executeAsync: buscarImpressora } = useAction(
    obterImpressoraComandaAction
  )

  function limpar() {
    setAcrescimos([])
    setDiasAvulsos([])
  }

  function adicionarAcrescimo() {
    setAcrescimos((atual) => [
      ...atual,
      { id: novoId(), descricao: '', valor: '0' },
    ])
  }

  function adicionarDiaAvulso() {
    setDiasAvulsos((atual) => [
      ...atual,
      { id: novoId(), data: intervalo.from ?? '', descricao: '', valor: '0' },
    ])
  }

  const subtotalDias = fechamentosNoPeriodo.reduce(
    (soma, f) => soma + f.valorTotal,
    0
  )
  const totalAcrescimos = somaValida(acrescimos)
  const totalAvulsos = somaValida(diasAvulsos)
  const valorTotal = subtotalDias + totalAcrescimos + totalAvulsos

  const somaCampo = <K extends keyof FechamentoDia>(campo: K): number =>
    fechamentosNoPeriodo.reduce(
      (soma, f) => soma + (f[campo] as number),
      0
    )

  async function imprimir() {
    if (!intervalo.from || !intervalo.to) return

    setImprimindo(true)
    try {
      const [resultadoLayout, resultadoImpressora] = await Promise.all([
        buscarLayout({}),
        buscarImpressora({}),
      ])

      const identificador =
        resultadoImpressora?.data?.impressora?.identificadorQz ?? null
      if (!identificador) {
        toast.error('Nenhuma impressora configurada.')
        return
      }

      const [
        { pdf },
        {
          FechamentoPeriodoPDF,
          LARGURA_BOBINA_PERIODO_MM,
          calcularAlturaFechamentoPeriodoMM,
        },
        { imprimirDocumentoUnico },
      ] = await Promise.all([
        import('@react-pdf/renderer'),
        import('../../../../lib/fechamento-periodo-pdf'),
        import('@/lib/qz-print'),
      ])

      const dados = {
        camposCabecalho: resultadoLayout?.data?.campos ?? CAMPOS_RESUMO_PADRAO,
        empresaClienteNome: empresaNome,
        de: intervalo.from,
        ate: intervalo.to,
        impressoEm: new Date().toISOString(),
        mostrarQuantidades: resumoMostraQuantidades,
        precoModo,
        pedeCafe,
        pedeLanche,
        pedeSuco,
        quantidadeP: somaCampo('quantidadeP'),
        quantidadeM: somaCampo('quantidadeM'),
        quantidadeG: somaCampo('quantidadeG'),
        quantidadeMarmitaUnica: somaCampo('quantidadeMarmitaUnica'),
        quantidadeLanche: somaCampo('quantidadeLanche'),
        quantidadeCafe: somaCampo('quantidadeCafe'),
        quantidadeSuco: somaCampo('quantidadeSuco'),
        totalDias: fechamentosNoPeriodo.length,
        subtotalDias,
        acrescimos: acrescimos
          .filter((a) => a.descricao.trim())
          .map((a) => ({ descricao: a.descricao.trim(), valor: Number(a.valor) || 0 })),
        diasAvulsos: diasAvulsos
          .filter((d) => d.data)
          .map((d) => ({
            data: d.data,
            descricao: d.descricao.trim() || 'Avulso',
            valor: Number(d.valor) || 0,
          })),
        valorTotal,
      }

      const blob = await pdf(<FechamentoPeriodoPDF dados={dados} />).toBlob()
      await imprimirDocumentoUnico(identificador, blob, {
        largura: LARGURA_BOBINA_PERIODO_MM,
        altura: calcularAlturaFechamentoPeriodoMM(
          dados.acrescimos.length + dados.diasAvulsos.length
        ),
      })
      toast.success('Fechamento do período enviado para impressão')
      setOpen(false)
      limpar()
    } catch {
      toast.error('Não foi possível imprimir. Confira o QZ Tray.')
    } finally {
      setImprimindo(false)
    }
  }

  const intervaloDefinido = Boolean(intervalo.from && intervalo.to)

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
        <Button variant="outline" size="sm" disabled={!intervaloDefinido}>
          <Printer className="size-4" />
          Fechamento do período
        </Button>
      </DrawerTrigger>
      <DrawerContent
        direction="right"
        variant="float"
        className="flex w-full flex-col gap-0 sm:max-w-md"
      >
        <DrawerHeader>
          <DrawerTitle>Fechamento do período</DrawerTitle>
          <DrawerDescription>
            {intervaloDefinido
              ? `${formatDateBR(intervalo.from!)} a ${formatDateBR(intervalo.to!)}`
              : 'Selecione um intervalo no filtro do histórico primeiro.'}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-6">
          <div className="flex flex-col gap-1.5 rounded-lg bg-muted p-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {fechamentosNoPeriodo.length}{' '}
                {fechamentosNoPeriodo.length === 1
                  ? 'dia finalizado'
                  : 'dias finalizados'}
              </span>
              <span className="font-medium">
                {formatCurrencyBRL(subtotalDias)}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Acréscimos</p>
              <Button variant="ghost" size="sm" onClick={adicionarAcrescimo}>
                <Plus className="size-4" />
                Adicionar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Não entra na conta de nenhum dia — só soma no total geral.
            </p>
            {acrescimos.map((linha, indice) => (
              <div key={linha.id} className="flex items-end gap-2">
                <div className="flex flex-1 flex-col gap-1">
                  <Label className="text-xs">Descrição</Label>
                  <Input
                    value={linha.descricao}
                    onChange={(e) =>
                      setAcrescimos((atual) =>
                        atual.map((a, i) =>
                          i === indice ? { ...a, descricao: e.target.value } : a
                        )
                      )
                    }
                    placeholder="Ex: Taxa de entrega"
                  />
                </div>
                <div className="flex w-28 flex-col gap-1">
                  <Label className="text-xs">Valor (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={linha.valor}
                    onChange={(e) =>
                      setAcrescimos((atual) =>
                        atual.map((a, i) =>
                          i === indice ? { ...a, valor: e.target.value } : a
                        )
                      )
                    }
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Remover acréscimo"
                  onClick={() =>
                    setAcrescimos((atual) =>
                      atual.filter((_, i) => i !== indice)
                    )
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 border-t pt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Dias avulsos</p>
              <Button variant="ghost" size="sm" onClick={adicionarDiaAvulso}>
                <Plus className="size-4" />
                Adicionar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Pra dias que não passaram pelo fluxo normal de finalização.
            </p>
            {diasAvulsos.map((linha, indice) => (
              <div key={linha.id} className="flex flex-col gap-2 rounded-lg bg-muted p-2">
                <div className="flex items-end gap-2">
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">Data</Label>
                    <Input
                      type="date"
                      className="w-40"
                      value={linha.data}
                      onChange={(e) =>
                        setDiasAvulsos((atual) =>
                          atual.map((d, i) =>
                            i === indice ? { ...d, data: e.target.value } : d
                          )
                        )
                      }
                    />
                  </div>
                  <div className="flex w-28 flex-col gap-1">
                    <Label className="text-xs">Valor (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={linha.valor}
                      onChange={(e) =>
                        setDiasAvulsos((atual) =>
                          atual.map((d, i) =>
                            i === indice ? { ...d, valor: e.target.value } : d
                          )
                        )
                      }
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Remover dia avulso"
                    onClick={() =>
                      setDiasAvulsos((atual) =>
                        atual.filter((_, i) => i !== indice)
                      )
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <Input
                  value={linha.descricao}
                  onChange={(e) =>
                    setDiasAvulsos((atual) =>
                      atual.map((d, i) =>
                        i === indice ? { ...d, descricao: e.target.value } : d
                      )
                    )
                  }
                  placeholder="Descrição (opcional)"
                />
              </div>
            ))}
          </div>
        </div>

        <DrawerFooter className="flex-col gap-3 border-t">
          <div className="flex justify-between text-sm font-medium">
            <span>Total do período</span>
            <span>{formatCurrencyBRL(valorTotal)}</span>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={imprimindo}
            >
              Cancelar
            </Button>
            <Button disabled={imprimindo} onClick={imprimir}>
              {imprimindo ? 'Imprimindo...' : 'Imprimir'}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
