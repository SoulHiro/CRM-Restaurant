'use client'

import { useEffect, useState } from 'react'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'

import { Button } from '@repo/ui/components/button'
import { Card, CardContent } from '@repo/ui/components/card'
import { Label } from '@repo/ui/components/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select'

import { diaSemanaLabel, formatDateBR } from '@/lib/formatters'
import { buscarRespostasAction, enviarRespostaAction } from '../lib/actions'
import type {
  CardapioDiaPublico,
  ColaboradorOption,
  EmpresaCardapioInfo,
} from '../lib/types'

const NAO_VOU_ALMOCAR = '__nao_vou_almocar__'
const SEM_TAMANHO = '__sem_tamanho__'

interface RespostaDia {
  data: string
  prato: string // id do prato ou NAO_VOU_ALMOCAR
  tamanho: string // 'P' | 'M' | 'G' | SEM_TAMANHO
}

export function RespostaForm({
  empresa,
  colaborador,
  cardapio,
}: {
  empresa: EmpresaCardapioInfo
  colaborador: ColaboradorOption
  cardapio: CardapioDiaPublico[]
}) {
  const usaTamanho = empresa.precoModo === 'por_tamanho'
  const [respostas, setRespostas] = useState<RespostaDia[] | null>(null)

  const { execute: buscarRespostas } = useAction(buscarRespostasAction, {
    onSuccess: ({ data }) => {
      const porData = new Map((data?.respostas ?? []).map((r) => [r.data, r]))
      setRespostas(
        cardapio.map((dia) => {
          const existente = porData.get(dia.data)
          const prato = existente?.recusou
            ? NAO_VOU_ALMOCAR
            : (findPratoId(dia, existente?.prato) ??
              dia.destaque?.id ??
              NAO_VOU_ALMOCAR)
          return {
            data: dia.data,
            prato,
            tamanho: existente?.tamanho ?? SEM_TAMANHO,
          }
        })
      )
    },
    onError: () => toast.error('Não foi possível carregar suas respostas'),
  })

  useEffect(() => {
    if (cardapio.length === 0) return
    setRespostas(null)
    buscarRespostas({
      colaboradorId: colaborador.id,
      from: cardapio[0]!.data,
      to: cardapio[cardapio.length - 1]!.data,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colaborador.id])

  const { execute: enviar, isExecuting } = useAction(enviarRespostaAction, {
    onSuccess: () => toast.success('Pedido enviado! Pode fechar essa página.'),
    onError: ({ error }) =>
      toast.error(error.serverError ?? 'Não foi possível enviar seu pedido'),
  })

  function atualizar(data: string, campo: 'prato' | 'tamanho', valor: string) {
    setRespostas((atual) =>
      (atual ?? []).map((r) => (r.data === data ? { ...r, [campo]: valor } : r))
    )
  }

  function confirmar() {
    if (!respostas) return
    enviar({
      empresaId: empresa.id,
      colaboradorId: colaborador.id,
      respostas: respostas.map((r) => ({
        data: r.data,
        prato: r.prato === NAO_VOU_ALMOCAR ? null : nomeDoprato(cardapio, r),
        tamanho:
          usaTamanho && r.tamanho !== SEM_TAMANHO
            ? (r.tamanho as 'P' | 'M' | 'G')
            : null,
      })),
    })
  }

  if (!respostas) {
    return (
      <p className="text-sm text-muted-foreground">
        Carregando seus pedidos...
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {cardapio.map((dia) => {
        const resposta = respostas.find((r) => r.data === dia.data)!
        const opcoes = dia.destaque
          ? [dia.destaque, ...dia.alternativas]
          : dia.alternativas

        return (
          <Card key={dia.data} className="border-0">
            <CardContent className="flex flex-col gap-3 p-4">
              <p className="text-sm font-semibold capitalize">
                {diaSemanaLabel(dia.data)} — {formatDateBR(dia.data)}
              </p>

              <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Prato</Label>
                <Select
                  value={resposta.prato}
                  onValueChange={(v) => atualizar(dia.data, 'prato', v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {opcoes.map((prato) => (
                      <SelectItem key={prato.id} value={prato.id}>
                        {prato.nome}
                        {dia.destaque?.id === prato.id ? ' (prato do dia)' : ''}
                      </SelectItem>
                    ))}
                    <SelectItem value={NAO_VOU_ALMOCAR}>
                      Não vou almoçar
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {usaTamanho && resposta.prato !== NAO_VOU_ALMOCAR && (
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm">Tamanho</Label>
                  <Select
                    value={resposta.tamanho}
                    onValueChange={(v) => atualizar(dia.data, 'tamanho', v)}
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
              )}
            </CardContent>
          </Card>
        )
      })}

      <Button disabled={isExecuting} onClick={confirmar}>
        {isExecuting ? 'Enviando...' : 'Confirmar pedido da semana'}
      </Button>
    </div>
  )
}

function findPratoId(
  dia: CardapioDiaPublico,
  nomeProcurado: string | null | undefined
): string | undefined {
  if (!nomeProcurado) return undefined
  const opcoes = dia.destaque
    ? [dia.destaque, ...dia.alternativas]
    : dia.alternativas
  return opcoes.find((p) => p.nome === nomeProcurado)?.id
}

function nomeDoprato(
  cardapio: CardapioDiaPublico[],
  resposta: RespostaDia
): string {
  const dia = cardapio.find((d) => d.data === resposta.data)!
  const opcoes = dia.destaque
    ? [dia.destaque, ...dia.alternativas]
    : dia.alternativas
  return opcoes.find((p) => p.id === resposta.prato)?.nome ?? resposta.prato
}
