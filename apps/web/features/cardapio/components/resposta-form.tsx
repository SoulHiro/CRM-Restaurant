'use client'

import { useEffect, useState } from 'react'
import { useAction } from 'next-safe-action/hooks'
import { CheckCircle2, Lock } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@repo/ui/components/button'
import { Card, CardContent } from '@repo/ui/components/card'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
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

import { diaSemanaLabel, formatDateBR, hojeISO } from '@/lib/formatters'
import { buscarRespostasAction, enviarRespostaAction } from '../lib/actions'
import { diaEditavel } from '../lib/edicao-helpers'
import { criarRespostaFormSchema } from '../lib/form-schema'
import { TURNO_LABEL } from '../lib/turno-helpers'
import type {
  CardapioDiaPublico,
  ColaboradorOption,
  EmpresaCardapioInfo,
  TurnoRefeicao,
} from '../lib/types'

const NAO_VOU_ALMOCAR = '__nao_vou_almocar__'
const SEM_TAMANHO = '__sem_tamanho__'

const TAMANHO_LABEL: Record<'P' | 'M' | 'G', string> = {
  P: 'Pequena',
  M: 'Média',
  G: 'Grande',
}

interface RespostaDia {
  data: string
  prato: string // id do prato ou NAO_VOU_ALMOCAR
  observacao: string
}

export function RespostaForm({
  empresa,
  colaborador,
  turno,
  cardapio,
}: {
  empresa: EmpresaCardapioInfo
  colaborador: ColaboradorOption
  turno: TurnoRefeicao
  cardapio: CardapioDiaPublico[]
}) {
  const usaTamanho = empresa.precoModo === 'por_tamanho'
  const hoje = hojeISO()
  const [respostas, setRespostas] = useState<RespostaDia[] | null>(null)
  const [tamanho, setTamanho] = useState(SEM_TAMANHO)
  const [whatsapp, setWhatsapp] = useState('')
  const [confirmacaoAberta, setConfirmacaoAberta] = useState(false)
  const [enviado, setEnviado] = useState(false)

  const { execute: buscarRespostas } = useAction(buscarRespostasAction, {
    onSuccess: ({ data }) => {
      const porData = new Map((data?.respostas ?? []).map((r) => [r.data, r]))
      const existentePrimeiroDia = cardapio[0] ? porData.get(cardapio[0].data) : null
      if (usaTamanho && existentePrimeiroDia?.tamanho) {
        setTamanho(existentePrimeiroDia.tamanho)
      }
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
            observacao: existente?.observacao ?? '',
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
      turno,
      from: cardapio[0]!.data,
      to: cardapio[cardapio.length - 1]!.data,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colaborador.id, turno])

  const { execute: enviar, isExecuting } = useAction(enviarRespostaAction, {
    onSuccess: () => setEnviado(true),
    onError: ({ error }) =>
      toast.error(error.serverError ?? 'Não foi possível enviar seu pedido'),
  })

  function atualizar(data: string, campo: 'prato' | 'observacao', valor: string) {
    setRespostas((atual) =>
      (atual ?? []).map((r) => (r.data === data ? { ...r, [campo]: valor } : r))
    )
  }

  const tamanhoResolvido =
    usaTamanho && tamanho !== SEM_TAMANHO ? (tamanho as 'P' | 'M' | 'G') : null

  const respostasEditaveis = (respostas ?? []).filter((r) =>
    diaEditavel(r.data, hoje)
  )
  const payload = {
    turno,
    colaboradorId: colaborador.id,
    tamanho: tamanhoResolvido,
    whatsapp: whatsapp.trim() || null,
    respostas: respostasEditaveis.map((r) => ({
      data: r.data,
      prato: r.prato === NAO_VOU_ALMOCAR ? null : nomeDoprato(cardapio, r),
      observacao: r.observacao.trim() || null,
    })),
  }

  function abrirConfirmacao() {
    const validacao = criarRespostaFormSchema(usaTamanho).safeParse(payload)
    if (!validacao.success) {
      toast.error(validacao.error.issues[0]?.message ?? 'Confira o formulário')
      return
    }
    setEnviado(false)
    setConfirmacaoAberta(true)
  }

  function enviarDeVerdade() {
    enviar({ empresaId: empresa.id, ...payload })
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
      {usaTamanho && (
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium text-muted-foreground">
            Tamanho da marmita — vale pra semana inteira
          </Label>
          <Select value={tamanho} onValueChange={setTamanho}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SEM_TAMANHO}>Escolher tamanho</SelectItem>
              <SelectItem value="P">Pequena</SelectItem>
              <SelectItem value="M">Média</SelectItem>
              <SelectItem value="G">Grande</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {cardapio.map((dia) => {
        const resposta = respostas.find((r) => r.data === dia.data)!
        const opcoes = dia.destaque
          ? [dia.destaque, ...dia.alternativas]
          : dia.alternativas
        const podeEditar = diaEditavel(dia.data, hoje)

        return (
          <Card
            key={dia.data}
            className={podeEditar ? 'border-0' : 'border-0 opacity-60'}
          >
            <CardContent className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold capitalize">
                  {diaSemanaLabel(dia.data)} — {formatDateBR(dia.data)}
                </p>
                {!podeEditar && (
                  <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                    <Lock className="size-3" />
                    {dia.data === hoje ? 'Já foi pra produção' : 'Já passou'}
                  </span>
                )}
              </div>

              {podeEditar ? (
                <>
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
                            {dia.destaque?.id === prato.id
                              ? ' (prato do dia)'
                              : ''}
                          </SelectItem>
                        ))}
                        <SelectItem value={NAO_VOU_ALMOCAR}>
                          Não vou almoçar
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {resposta.prato !== NAO_VOU_ALMOCAR && (
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-sm">Observação (opcional)</Label>
                      <Input
                        value={resposta.observacao}
                        onChange={(e) =>
                          atualizar(dia.data, 'observacao', e.target.value)
                        }
                        placeholder="Ex: sem cebola"
                      />
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {resposta.prato === NAO_VOU_ALMOCAR
                    ? 'Não ia almoçar nesse dia.'
                    : (findPratoNome(dia, resposta.prato) ??
                      'Sem pedido registrado.')}
                </p>
              )}
            </CardContent>
          </Card>
        )
      })}

      <div className="flex flex-col gap-1.5">
        <Label className="text-sm">WhatsApp (opcional)</Label>
        <Input
          type="tel"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          placeholder="(11) 99999-9999"
        />
      </div>

      <Button onClick={abrirConfirmacao}>Confirmar pedido da semana</Button>

      <Drawer open={confirmacaoAberta} onOpenChange={setConfirmacaoAberta}>
        <DrawerContent>
          {enviado ? (
            <div className="flex flex-col items-center gap-3 px-4 pb-8 pt-4 text-center">
              <CheckCircle2 className="size-10 text-primary" />
              <DrawerTitle>Pedido enviado!</DrawerTitle>
              <DrawerDescription>
                Já registramos sua semana. Pode fechar essa página.
              </DrawerDescription>
              <DrawerClose asChild>
                <Button className="mt-2 w-full">Fechar</Button>
              </DrawerClose>
            </div>
          ) : (
            <>
              <DrawerHeader>
                <DrawerTitle>Confira antes de enviar</DrawerTitle>
                <DrawerDescription>
                  {colaborador.nome} · {TURNO_LABEL[turno]}
                  {tamanhoResolvido &&
                    ` · Marmita ${TAMANHO_LABEL[tamanhoResolvido]}`}
                </DrawerDescription>
              </DrawerHeader>

              <div className="flex flex-col gap-2 overflow-y-auto px-4 pb-2">
                {respostasEditaveis.map((r) => (
                  <div
                    key={r.data}
                    className="flex items-start justify-between gap-3 rounded-lg bg-muted p-3 text-sm"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium capitalize">
                        {diaSemanaLabel(r.data)} — {formatDateBR(r.data)}
                      </span>
                      {r.observacao.trim() && (
                        <span className="text-xs text-muted-foreground">
                          Obs: {r.observacao.trim()}
                        </span>
                      )}
                    </div>
                    <span className="shrink-0 text-right text-muted-foreground">
                      {r.prato === NAO_VOU_ALMOCAR
                        ? 'Não vou almoçar'
                        : nomeDoprato(cardapio, r)}
                    </span>
                  </div>
                ))}
                {whatsapp.trim() && (
                  <p className="px-1 text-xs text-muted-foreground">
                    WhatsApp: {whatsapp.trim()}
                  </p>
                )}
              </div>

              <DrawerFooter>
                <Button disabled={isExecuting} onClick={enviarDeVerdade}>
                  {isExecuting ? 'Enviando...' : 'Confirmar envio'}
                </Button>
                <DrawerClose asChild>
                  <Button variant="outline" disabled={isExecuting}>
                    Voltar e editar
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>
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

function findPratoNome(
  dia: CardapioDiaPublico,
  pratoId: string
): string | undefined {
  const opcoes = dia.destaque
    ? [dia.destaque, ...dia.alternativas]
    : dia.alternativas
  return opcoes.find((p) => p.id === pratoId)?.nome
}

function nomeDoprato(
  cardapio: CardapioDiaPublico[],
  resposta: RespostaDia
): string {
  const dia = cardapio.find((d) => d.data === resposta.data)!
  return findPratoNome(dia, resposta.prato) ?? resposta.prato
}
